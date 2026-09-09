import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { quoteUpdateSchema } from "@/lib/validation/quote";
import { QUOTE_FULL_INCLUDE, recomputeAndCacheQuote, toCalcInput } from "@/lib/quotes/service";
import { calcQuote } from "@/lib/calc/engine";

async function loadOwnedQuote(id: string, companyId: string) {
  return prisma.quote.findFirst({ where: { id, companyId } });
}

export async function GET(_req: NextRequest, { params }: RouteContext<"/api/quotes/[id]">) {
  try {
    const companyId = await getCompanyId();
    const { id } = await params;

    const quote = await prisma.quote.findFirst({
      where: { id, companyId: companyId },
      include: QUOTE_FULL_INCLUDE,
    });
    if (!quote) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const result = calcQuote(toCalcInput(quote));
    return NextResponse.json({ quote, result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/quotes/[id]">) {
  try {
    const companyId = await getCompanyId();
    const { id } = await params;
    const body = quoteUpdateSchema.parse(await req.json());

    const existing = await loadOwnedQuote(id, companyId);
    if (!existing) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const { items, otherCosts, rooms, ...scalarFields } = body;

    await prisma.$transaction(async (tx) => {
      await tx.quote.update({ where: { id }, data: scalarFields });

      // Los items referencian habitaciones por id, así que las habitaciones deben
      // recrearse antes que los items para poder mapear los ids nuevos.
      let roomIdMap = new Map<string, string>();
      const willRecreateItems = items !== undefined;

      if (rooms) {
        // Borrar items primero (si se van a recrear): sus QuoteItemRoom dependen
        // de las habitaciones. Si no se tocan los items, se dejan intactos aunque
        // pierdan el vínculo con las habitaciones antiguas eliminadas.
        if (willRecreateItems) {
          await tx.quoteItem.deleteMany({ where: { quoteId: id } });
        }
        await tx.room.deleteMany({ where: { quoteId: id } });
        for (const [index, room] of rooms.entries()) {
          const created = await tx.room.create({
            data: {
              quoteId: id,
              name: room.name,
              length: room.length,
              width: room.width,
              height: room.height,
              sortOrder: index,
              openings: {
                create: room.openings.map((o, oIndex) => ({
                  type: o.type,
                  width: o.width,
                  height: o.height,
                  quantity: o.quantity,
                  sortOrder: oIndex,
                })),
              },
            },
          });
          if (room.id) roomIdMap.set(room.id, created.id);
        }
      } else if (willRecreateItems) {
        // Sin cambios en habitaciones: recupera el mapeo id->id tal cual para
        // poder seguir vinculando items a las habitaciones existentes.
        const existingRooms = await tx.room.findMany({ where: { quoteId: id } });
        roomIdMap = new Map(existingRooms.map((r) => [r.id, r.id]));
        await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      }

      if (willRecreateItems && items) {
        for (const [index, item] of items.entries()) {
          const roomIds = item.roomIds
            .map((rid) => roomIdMap.get(rid))
            .filter((rid): rid is string => Boolean(rid));

          await tx.quoteItem.create({
            data: {
              quoteId: id,
              priceListItemId: item.priceListItemId ?? null,
              categoryName: item.categoryName,
              name: item.name,
              descriptionInternal: item.descriptionInternal,
              descriptionClient: item.descriptionClient,
              pricingMethod: item.pricingMethod,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              useDetailedLabor: item.useDetailedLabor,
              workerCount: item.workerCount,
              hoursPerWorker: item.hoursPerWorker,
              hourlyRate: item.hourlyRate,
              internalHourlyRate: item.internalHourlyRate,
              discountType: item.discountType,
              discountValue: item.discountValue,
              companyCost: item.companyCost,
              deductionType: item.deductionType,
              measurementSource: item.measurementSource,
              subtractOpeningWidths: item.subtractOpeningWidths,
              sortOrder: index,
              materials: {
                create: item.materials.map((m, mIndex) => ({
                  materialLibraryItemId: m.materialLibraryItemId ?? null,
                  name: m.name,
                  description: m.description,
                  quantity: m.quantity,
                  unit: m.unit,
                  purchasePrice: m.purchasePrice,
                  marginPercent: m.marginPercent,
                  calcType: m.calcType,
                  coveragePerUnit: m.coveragePerUnit,
                  coats: m.coats,
                  wastePercent: m.wastePercent,
                  packageSize: m.packageSize,
                  containerSizes: m.containerSizes ?? undefined,
                  calculatedQuantity: m.calculatedQuantity,
                  sortOrder: mIndex,
                })),
              },
              rooms: {
                create: roomIds.map((roomId) => ({ roomId })),
              },
            },
          });
        }
      }

      if (otherCosts) {
        await tx.quoteOtherCost.deleteMany({ where: { quoteId: id } });
        for (const [index, cost] of otherCosts.entries()) {
          await tx.quoteOtherCost.create({
            data: {
              quoteId: id,
              name: cost.name,
              quantity: cost.quantity,
              unitPrice: cost.unitPrice,
              sortOrder: index,
            },
          });
        }
      }
    });

    const result = await recomputeAndCacheQuote(id);
    const quote = await prisma.quote.findUniqueOrThrow({
      where: { id },
      include: QUOTE_FULL_INCLUDE,
    });

    return NextResponse.json({ quote, result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext<"/api/quotes/[id]">) {
  try {
    const companyId = await getCompanyId();
    const { id } = await params;

    const existing = await loadOwnedQuote(id, companyId);
    if (!existing) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
