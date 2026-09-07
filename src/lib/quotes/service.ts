import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { calcQuote } from "@/lib/calc/engine";
import type { CalcQuoteInput, CalcQuoteResult } from "@/lib/calc/types";
import { toNumber } from "@/lib/utils/decimal";

export const QUOTE_FULL_INCLUDE = {
  customer: true,
  project: true,
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      materials: { orderBy: { sortOrder: "asc" as const } },
      rooms: true,
    },
  },
  otherCosts: { orderBy: { sortOrder: "asc" as const } },
  rooms: {
    orderBy: { sortOrder: "asc" as const },
    include: { openings: { orderBy: { sortOrder: "asc" as const } } },
  },
} satisfies Prisma.QuoteInclude;

export type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: typeof QUOTE_FULL_INCLUDE;
}>;

export function toCalcInput(quote: QuoteWithRelations): CalcQuoteInput {
  return {
    discountType: quote.discountType,
    discountValue: toNumber(quote.discountValue),
    vatRatePercent: toNumber(quote.vatRatePercent),
    rotEnabled: quote.rotEnabled,
    rotPercent: toNumber(quote.rotPercent),
    otherCosts: quote.otherCosts.map((c) => ({
      id: c.id,
      quantity: toNumber(c.quantity),
      unitPrice: toNumber(c.unitPrice),
    })),
    items: quote.items.map((item) => ({
      id: item.id,
      useDetailedLabor: item.useDetailedLabor,
      workerCount: item.workerCount != null ? toNumber(item.workerCount) : null,
      hoursPerWorker: item.hoursPerWorker != null ? toNumber(item.hoursPerWorker) : null,
      hourlyRate: item.hourlyRate != null ? toNumber(item.hourlyRate) : null,
      internalHourlyRate: item.internalHourlyRate != null ? toNumber(item.internalHourlyRate) : null,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      discountType: item.discountType,
      discountValue: toNumber(item.discountValue),
      companyCost: item.companyCost != null ? toNumber(item.companyCost) : null,
      materials: item.materials.map((m) => ({
        id: m.id,
        quantity: toNumber(m.quantity),
        purchasePrice: toNumber(m.purchasePrice),
        marginPercent: toNumber(m.marginPercent),
      })),
    })),
  };
}

/** Recalcula los totales de un presupuesto y los persiste en los campos cacheados. */
export async function recomputeAndCacheQuote(quoteId: string): Promise<CalcQuoteResult> {
  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: QUOTE_FULL_INCLUDE,
  });

  const result = calcQuote(toCalcInput(quote));

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      cachedLaborTotal: result.laborAfterDiscount,
      cachedMaterialTotal: result.materialAfterDiscount,
      cachedOtherTotal: result.otherAfterDiscount,
      cachedSubtotal: result.subtotalAfterDiscount,
      cachedVatAmount: result.vatAmount,
      cachedTotalInclVat: result.totalInclVat,
      cachedRotDeduction: result.rotDeduction,
      cachedTotalDue: result.totalDue,
      cachedCostInternal: result.totalCostInternal,
      cachedLaborCostInternal: result.laborCostInternal,
      cachedMaterialCostInternal: result.materialCostInternal,
      cachedGrossProfit: result.grossProfit,
      cachedMarginPercent: result.marginPercent,
    },
  });

  return result;
}

/** Genera el siguiente número de presupuesto correlativo: OFF-YYYY-NNN. */
export async function generateQuoteNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();

  const company = await prisma.$transaction(async (tx) => {
    const updated = await tx.company.update({
      where: { id: companyId },
      data: { nextQuoteSequence: { increment: 1 } },
    });
    return updated;
  });

  const sequence = company.nextQuoteSequence - 1;
  return `OFF-${year}-${String(sequence).padStart(3, "0")}`;
}
