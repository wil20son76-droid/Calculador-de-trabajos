import type {
  CalcItemInput,
  CalcItemResult,
  CalcMaterialInput,
  CalcMaterialResult,
  CalcQuoteInput,
  CalcQuoteResult,
  DiscountType,
} from "./types";
import { round2 } from "./round";

export { round2 } from "./round";

/** Calcula el importe de un descuento (porcentaje o fijo) sobre una base, acotado a la base. */
export function computeDiscountAmount(
  base: number,
  type: DiscountType,
  value: number
): number {
  if (base <= 0 || !value) return 0;
  if (type === "PERCENT") return round2(base * (Math.max(0, value) / 100));
  if (type === "FIXED") return round2(Math.min(Math.max(0, value), base));
  return 0;
}

export function calcMaterial(material: CalcMaterialInput): CalcMaterialResult {
  const quantity = material.quantity || 0;
  const purchasePrice = material.purchasePrice || 0;
  const marginPercent = material.marginPercent || 0;
  const unitSellPrice = round2(purchasePrice * (1 + marginPercent / 100));
  const total = round2(unitSellPrice * quantity);
  const totalCost = round2(purchasePrice * quantity);
  return {
    id: material.id,
    quantity,
    purchasePrice,
    marginPercent,
    unitSellPrice,
    total,
    totalCost,
  };
}

export function calcItem(item: CalcItemInput): CalcItemResult {
  let effectiveQuantity = item.quantity || 0;
  let effectiveUnitPrice = item.unitPrice || 0;
  let laborTotalHours: number | null = null;

  if (item.useDetailedLabor) {
    const workers = item.workerCount || 0;
    const hours = item.hoursPerWorker || 0;
    laborTotalHours = round2(workers * hours);
    effectiveQuantity = laborTotalHours;
    effectiveUnitPrice = item.hourlyRate || 0;
  }

  const laborGross = round2(effectiveQuantity * effectiveUnitPrice);

  const materials = item.materials.map(calcMaterial);
  const materialsGross = round2(materials.reduce((sum, m) => sum + m.total, 0));
  const materialsCost = round2(materials.reduce((sum, m) => sum + m.totalCost, 0));

  const grossTotal = round2(laborGross + materialsGross);
  const discountAmount = computeDiscountAmount(
    grossTotal,
    item.discountType,
    item.discountValue
  );

  // El descuento de línea se reparte proporcionalmente entre mano de obra y materiales
  // para poder seguir separando ambos importes en el resumen y en el cálculo de ROT.
  const laborShare = grossTotal > 0 ? laborGross / grossTotal : 0;
  const laborNet = round2(laborGross - discountAmount * laborShare);
  const materialsNet = round2(materialsGross - discountAmount * (1 - laborShare));
  const lineTotal = round2(laborNet + materialsNet);

  // Coste interno de mano de obra: si se usa el modo de horas detallado y se ha
  // indicado un coste interno por hora (p.ej. salario real), se calcula a partir
  // de las horas reales; `companyCost` se suma como coste interno adicional
  // (p.ej. subcontratas) tanto si se usan horas detalladas como si no.
  const internalLaborFromHours =
    item.useDetailedLabor && item.internalHourlyRate
      ? round2((laborTotalHours || 0) * item.internalHourlyRate)
      : 0;
  const laborCostInternal = round2(internalLaborFromHours + (item.companyCost || 0));
  const costInternal = round2(laborCostInternal + materialsCost);

  return {
    id: item.id,
    effectiveQuantity,
    effectiveUnitPrice,
    laborTotalHours,
    laborGross,
    materialsGross,
    grossTotal,
    discountAmount,
    laborNet,
    materialsNet,
    lineTotal,
    materialsCost,
    laborCostInternal,
    costInternal,
    deductionType: item.deductionType,
    materials,
  };
}

/**
 * Calcula el presupuesto completo: mano de obra, materiales, otros costes,
 * descuentos (de línea y globales), moms/IVA y ROT/RUT-avdrag.
 *
 * Ninguna regla fiscal está codificada de forma fija: vatRatePercent, rotPercent,
 * rutPercent y rotMaxDeduction siempre llegan como parámetros configurables desde
 * la empresa o desde el propio presupuesto (snapshot al crearlo).
 */
export function calcQuote(input: CalcQuoteInput): CalcQuoteResult {
  const items = input.items.map(calcItem);
  const generalMaterials = input.generalMaterials.map(calcMaterial);

  const laborSubtotal = round2(items.reduce((sum, i) => sum + i.laborNet, 0));
  const itemMaterialSubtotal = round2(items.reduce((sum, i) => sum + i.materialsNet, 0));
  const generalMaterialsGross = round2(generalMaterials.reduce((sum, m) => sum + m.total, 0));
  const generalMaterialsCost = round2(generalMaterials.reduce((sum, m) => sum + m.totalCost, 0));
  const materialSubtotal = round2(itemMaterialSubtotal + generalMaterialsGross);
  const otherCostsSubtotal = round2(
    input.otherCosts.reduce((sum, c) => sum + (c.quantity || 0) * (c.unitPrice || 0), 0)
  );
  const subtotalBeforeDiscount = round2(
    laborSubtotal + materialSubtotal + otherCostsSubtotal
  );

  const globalDiscountAmount = computeDiscountAmount(
    subtotalBeforeDiscount,
    input.discountType,
    input.discountValue
  );

  const laborRatio = subtotalBeforeDiscount > 0 ? laborSubtotal / subtotalBeforeDiscount : 0;
  const materialRatio =
    subtotalBeforeDiscount > 0 ? materialSubtotal / subtotalBeforeDiscount : 0;
  const otherRatio = subtotalBeforeDiscount > 0 ? otherCostsSubtotal / subtotalBeforeDiscount : 0;

  const laborAfterDiscount = round2(laborSubtotal - globalDiscountAmount * laborRatio);
  const materialAfterDiscount = round2(
    materialSubtotal - globalDiscountAmount * materialRatio
  );
  const otherAfterDiscount = round2(otherCostsSubtotal - globalDiscountAmount * otherRatio);
  const subtotalAfterDiscount = round2(
    laborAfterDiscount + materialAfterDiscount + otherAfterDiscount
  );

  const vatAmount = round2(subtotalAfterDiscount * (input.vatRatePercent / 100));
  const totalInclVat = round2(subtotalAfterDiscount + vatAmount);

  // Bases ROT y RUT: cada línea elige su propia Skattereduktion (o ninguna), así
  // que las dos bases se calculan por separado a partir de la mano de obra de los
  // items marcados con cada tipo. Los materiales y otros costes nunca entran aquí.
  // Se aplica la misma tasa de descuento global que al resto de la mano de obra,
  // para mantener la coherencia con laborAfterDiscount sin necesitar prorrateo por item.
  const rotEligibleLaborSubtotal = round2(
    items.filter((i) => i.deductionType === "ROT").reduce((sum, i) => sum + i.laborNet, 0)
  );
  const rutEligibleLaborSubtotal = round2(
    items.filter((i) => i.deductionType === "RUT").reduce((sum, i) => sum + i.laborNet, 0)
  );
  const laborDiscountRate = laborSubtotal > 0 ? laborAfterDiscount / laborSubtotal : 1;
  const rotEligibleLaborBase = round2(rotEligibleLaborSubtotal * laborDiscountRate);
  const rutEligibleLaborBase = round2(rutEligibleLaborSubtotal * laborDiscountRate);

  let rotDeduction = 0;
  if (rotEligibleLaborBase > 0 && input.rotPercent > 0) {
    rotDeduction = round2(rotEligibleLaborBase * (input.rotPercent / 100));
    if (input.rotMaxDeduction != null) {
      rotDeduction = Math.min(rotDeduction, input.rotMaxDeduction);
    }
  }
  let rutDeduction = 0;
  if (rutEligibleLaborBase > 0 && input.rutPercent > 0) {
    rutDeduction = round2(rutEligibleLaborBase * (input.rutPercent / 100));
  }
  const totalDue = round2(totalInclVat - rotDeduction - rutDeduction);

  // Desglose interno: venta / coste mano de obra / coste materiales / otros costes.
  // "Otros costes" se pasan al cliente a coste (sin margen), por lo que su coste
  // interno es el mismo importe que su venta.
  const laborCostInternal = round2(items.reduce((sum, i) => sum + i.laborCostInternal, 0));
  const materialCostInternal = round2(
    items.reduce((sum, i) => sum + i.materialsCost, 0) + generalMaterialsCost
  );
  const totalCostInternal = round2(laborCostInternal + materialCostInternal + otherCostsSubtotal);
  const grossProfit = round2(subtotalAfterDiscount - totalCostInternal);
  const marginPercent =
    subtotalAfterDiscount > 0 ? round2((grossProfit / subtotalAfterDiscount) * 100) : 0;

  return {
    items,
    generalMaterials,
    laborSubtotal,
    materialSubtotal,
    otherCostsSubtotal,
    subtotalBeforeDiscount,
    globalDiscountAmount,
    laborAfterDiscount,
    materialAfterDiscount,
    otherAfterDiscount,
    subtotalAfterDiscount,
    vatAmount,
    totalInclVat,
    rotEligibleLaborBase,
    rotDeduction,
    rutEligibleLaborBase,
    rutDeduction,
    totalDue,
    laborCostInternal,
    materialCostInternal,
    totalCostInternal,
    grossProfit,
    marginPercent,
  };
}
