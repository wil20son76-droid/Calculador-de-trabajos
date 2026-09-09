import type { QuoteDraft } from "@/lib/quotes/draft-types";
import type { CalcQuoteInput } from "./types";

export function draftToCalcInput(draft: QuoteDraft): CalcQuoteInput {
  return {
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    vatRatePercent: draft.vatRatePercent,
    rotPercent: draft.rotPercent,
    rutPercent: draft.rutPercent,
    otherCosts: draft.otherCosts.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
    })),
    items: draft.items.map((item) => ({
      id: item.id,
      useDetailedLabor: item.useDetailedLabor,
      workerCount: item.workerCount,
      hoursPerWorker: item.hoursPerWorker,
      hourlyRate: item.hourlyRate,
      internalHourlyRate: item.internalHourlyRate,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountType: item.discountType,
      discountValue: item.discountValue,
      companyCost: item.companyCost,
      deductionType: item.deductionType,
      materials: item.materials.map((m) => ({
        id: m.id,
        quantity: m.quantity,
        purchasePrice: m.purchasePrice,
        marginPercent: m.marginPercent,
      })),
    })),
  };
}
