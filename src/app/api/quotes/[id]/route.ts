import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { quoteUpdateSchema } from "@/lib/validation/quote";
import { QUOTE_FULL_INCLUDE, recomputeAndCacheQuote, toCalcInput } from "@/lib/quotes/service";
import { calcQuote } from "@/lib/calc/engine";

async function loadOwnedQuote(id: string, companyId: string) {
  return prisma.quote.findFirst({ where: { id, companyId } });
}

export async function GET(_req: NextRequest, { params }: RouteContext<"/api/quotes/[id]">) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const quote = await prisma.quote.findFirst({
      where: { id, companyId: session.user.companyId },
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
    const session = await requireSession();
    const { id } = await params;
    const body = quoteUpdateSchema.parse(await req.json());

    const existing = await loadOwnedQuote(id, session.user.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const { items, otherCosts, ...scalarFields } = body;

    await prisma.$transaction(async (tx) => {
      await tx.quote.update({ where: { id }, data: scalarFields });

      if (items) {
        await tx.quoteItem.deleteMany({ where: { quoteId: id } });
        for (const [index, item] of items.entries()) {
          await tx.quoteItem.create({
            data: {
              quoteId: id,
              priceListItemId: item.priceListItemId ?? null,
              categoryName: item.categoryName,
              name: item.name,
              descriptionInternal: item.descriptionInternal,
              descriptionClient: item.descriptionClient,
              includedText: item.includedText,
              excludedText: item.excludedText,
              pricingMethod: item.pricingMethod,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              useDetailedLabor: item.useDetailedLabor,
              workerCount: item.workerCount,
              hoursPerWorker: item.hoursPerWorker,
              hourlyRate: item.hourlyRate,
              discountType: item.discountType,
              discountValue: item.discountValue,
              companyCost: item.companyCost,
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
                  sortOrder: mIndex,
                })),
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
    const session = await requireSession();
    const { id } = await params;

    const existing = await loadOwnedQuote(id, session.user.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
