// Tipos de entrada/salida del motor de cálculo de presupuestos.
// Estos tipos son independientes de Prisma y de la UI: solo números planos,
// para que el motor sea puro, testeable y reutilizable en frontend o backend.

export type DiscountType = "NONE" | "PERCENT" | "FIXED";

/**
 * Skattereduktion aplicable a la mano de obra de un trabajo: ROT (reparación/
 * reforma), RUT (servicios domésticos) o ninguna. Nunca se asume automáticamente
 * a partir de la categoría del trabajo: siempre se elige por línea.
 */
export type DeductionType = "NONE" | "ROT" | "RUT";

export interface CalcMaterialInput {
  id: string;
  quantity: number;
  purchasePrice: number;
  marginPercent: number;
}

export interface CalcItemInput {
  id: string;
  useDetailedLabor: boolean;
  workerCount?: number | null;
  hoursPerWorker?: number | null;
  hourlyRate?: number | null;
  /** Coste interno real por hora (p.ej. salario pagado), distinto del precio/hora facturado. */
  internalHourlyRate?: number | null;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  /** Coste interno adicional de la empresa para esta línea, nunca visible al cliente. */
  companyCost?: number | null;
  /** Skattereduktion de esta línea: ROT, RUT o ninguna (NONE). */
  deductionType: DeductionType;
  materials: CalcMaterialInput[];
}

export interface CalcOtherCostInput {
  id: string;
  quantity: number;
  unitPrice: number;
}

export interface CalcQuoteInput {
  items: CalcItemInput[];
  otherCosts: CalcOtherCostInput[];
  discountType: DiscountType;
  discountValue: number;
  vatRatePercent: number;
  /** % ROT-avdrag, snapshot del presupuesto (configurable en Configuración). */
  rotPercent: number;
  /** % RUT-avdrag, snapshot del presupuesto (configurable en Configuración). */
  rutPercent: number;
  rotMaxDeduction?: number | null;
}

export interface CalcMaterialResult {
  id: string;
  quantity: number;
  purchasePrice: number;
  marginPercent: number;
  unitSellPrice: number;
  total: number;
  totalCost: number;
}

export interface CalcItemResult {
  id: string;
  effectiveQuantity: number;
  effectiveUnitPrice: number;
  laborTotalHours: number | null;
  laborGross: number;
  materialsGross: number;
  grossTotal: number;
  discountAmount: number;
  laborNet: number;
  materialsNet: number;
  lineTotal: number;
  materialsCost: number;
  /** Coste interno de mano de obra (horas × precio interno/h), separado del de materiales. */
  laborCostInternal: number;
  costInternal: number;
  deductionType: DeductionType;
  materials: CalcMaterialResult[];
}

export interface CalcQuoteResult {
  items: CalcItemResult[];

  laborSubtotal: number;
  materialSubtotal: number;
  otherCostsSubtotal: number;
  subtotalBeforeDiscount: number;

  globalDiscountAmount: number;
  laborAfterDiscount: number;
  materialAfterDiscount: number;
  otherAfterDiscount: number;
  subtotalAfterDiscount: number;

  vatAmount: number;
  totalInclVat: number;

  /** Base ROT: solo la mano de obra de los items con deductionType ROT, tras descuentos. */
  rotEligibleLaborBase: number;
  rotDeduction: number;
  /** Base RUT: solo la mano de obra de los items con deductionType RUT, tras descuentos. */
  rutEligibleLaborBase: number;
  rutDeduction: number;
  totalDue: number;

  // Solo para uso interno de la empresa — nunca debe mostrarse en el PDF de cliente.
  // Venta / coste mano de obra / coste materiales / otros costes / beneficio / margen.
  laborCostInternal: number;
  materialCostInternal: number;
  totalCostInternal: number;
  grossProfit: number;
  marginPercent: number;
}
