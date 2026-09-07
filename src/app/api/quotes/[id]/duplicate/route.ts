import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { QUOTE_FULL_INCLUDE, generateQuoteNumber, recomputeAndCacheQuote } from "@/lib/quotes/service";

export async function POST(_req: NextRequest, { params }: RouteContext<"/api/quotes/[id]/duplicate">) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const original = await prisma.quote.findFirst({
      where: { id, companyId: session.user.companyId },
      include: QUOTE_FULL_INCLUDE,
    });
    if (!original) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const quoteNumber = await generateQuoteNumber(session.user.companyId);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const copy = await prisma.quote.create({
      data: {
        companyId: session.user.companyId,
        quoteNumber,
        status: "DRAFT",
        customerId: original.customerId,
        projectId: original.projectId,
        projectName: original.projectName,
        projectDescription: original.projectDescription,
        siteAddressDifferent: original.siteAddressDifferent,
        siteAddress: original.siteAddress,
        sitePostalCode: original.sitePostalCode,
        siteCity: original.siteCity,
        validUntil,
        currency: original.currency,
        vatRatePercent: original.vatRatePercent,
        rotEnabled: original.rotEnabled,
        rotPercent: original.rotPercent,
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
        items: {
          create: original.items.map((item) => ({
            priceListItemId: item.priceListItemId,
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
            sortOrder: item.sortOrder,
            materials: {
              create: item.materials.map((m) => ({
                materialLibraryItemId: m.materialLibraryItemId,
                name: m.name,
                description: m.description,
                quantity: m.quantity,
                unit: m.unit,
                purchasePrice: m.purchasePrice,
                marginPercent: m.marginPercent,
                sortOrder: m.sortOrder,
              })),
            },
          })),
        },
        otherCosts: {
          create: original.otherCosts.map((c) => ({
            name: c.name,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            sortOrder: c.sortOrder,
          })),
        },
      },
    });

    await recomputeAndCacheQuote(copy.id);

    return NextResponse.json(copy, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
