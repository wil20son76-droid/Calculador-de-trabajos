import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { QUOTE_FULL_INCLUDE, generateQuoteNumber, recomputeAndCacheQuote } from "@/lib/quotes/service";

export async function POST(_req: NextRequest, { params }: RouteContext<"/api/quotes/[id]/duplicate">) {
  try {
    const companyId = await getCompanyId();
    const { id } = await params;

    const original = await prisma.quote.findFirst({
      where: { id, companyId: companyId },
      include: QUOTE_FULL_INCLUDE,
    });
    if (!original) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const quoteNumber = await generateQuoteNumber(companyId);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const copy = await prisma.quote.create({
      data: {
        companyId: companyId,
        quoteNumber,
        status: "DRAFT",
        customerId: original.customerId,
        projectId: original.projectId,
        // Sección 20: el duplicado siempre lleva un nuevo id/fecha de creación
        // (Prisma los genera solos al crear) y el nombre se marca como copia,
        // para no confundirlo nunca con el original al verlo en "Mis cálculos".
        projectName: original.projectName ? `Copia de ${original.projectName}` : "Copia",
        projectDescription: original.projectDescription,
        siteAddressDifferent: original.siteAddressDifferent,
        siteAddress: original.siteAddress,
        sitePostalCode: original.sitePostalCode,
        siteCity: original.siteCity,
        validUntil,
        currency: original.currency,
        vatRatePercent: original.vatRatePercent,
        rotPercent: original.rotPercent,
        rutPercent: original.rutPercent,
        discountType: original.discountType,
        discountValue: original.discountValue,
        materialMarginDefaultPercent: original.materialMarginDefaultPercent,
        showHours: original.showHours,
        showHourlyRate: original.showHourlyRate,
        showMaterialsIndividually: original.showMaterialsIndividually,
        showMaterialPrices: original.showMaterialPrices,
        showUnitPrice: original.showUnitPrice,
        showOnlyTotalPerJob: original.showOnlyTotalPerJob,
        showMaterialsOnPdf: original.showMaterialsOnPdf,
        includedText: original.includedText,
        excludedText: original.excludedText,
        termsText: original.termsText,
        notesClient: original.notesClient,
        otherCosts: {
          create: original.otherCosts.map((c) => ({
            name: c.name,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            sortOrder: c.sortOrder,
          })),
        },
        generalMaterials: {
          create: original.generalMaterials.map((m) => ({
            materialLibraryItemId: m.materialLibraryItemId,
            categoryName: m.categoryName,
            name: m.name,
            description: m.description,
            supplier: m.supplier,
            notes: m.notes,
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
            baseQuantity: m.baseQuantity,
            calculatedQuantity: m.calculatedQuantity,
            sortOrder: m.sortOrder,
          })),
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      const roomIdMap = new Map<string, string>();
      for (const room of original.rooms) {
        const createdRoom = await tx.room.create({
          data: {
            quoteId: copy.id,
            name: room.name,
            length: room.length,
            width: room.width,
            height: room.height,
            sortOrder: room.sortOrder,
            openings: {
              create: room.openings.map((o) => ({
                type: o.type,
                width: o.width,
                height: o.height,
                quantity: o.quantity,
                sortOrder: o.sortOrder,
              })),
            },
          },
        });
        roomIdMap.set(room.id, createdRoom.id);
      }

      for (const item of original.items) {
        const newRoomIds = item.rooms
          .map((link) => roomIdMap.get(link.roomId))
          .filter((rid): rid is string => Boolean(rid));

        await tx.quoteItem.create({
          data: {
            quoteId: copy.id,
            priceListItemId: item.priceListItemId,
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
            sortOrder: item.sortOrder,
            materials: {
              create: item.materials.map((m) => ({
                materialLibraryItemId: m.materialLibraryItemId,
                categoryName: m.categoryName,
                name: m.name,
                description: m.description,
                supplier: m.supplier,
                notes: m.notes,
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
                baseQuantity: m.baseQuantity,
                calculatedQuantity: m.calculatedQuantity,
                sortOrder: m.sortOrder,
              })),
            },
            rooms: {
              create: newRoomIds.map((roomId) => ({ roomId })),
            },
          },
        });
      }
    });

    await recomputeAndCacheQuote(copy.id);

    return NextResponse.json(copy, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
