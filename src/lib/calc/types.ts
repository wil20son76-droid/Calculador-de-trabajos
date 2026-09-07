// Tipos de entrada/salida del motor de cálculo de presupuestos.
// Estos tipos son independientes de Prisma y de la UI: solo números planos,
// para que el motor sea puro, testeable y reutilizable en frontend o backend.

export type DiscountType = "NONE" | "PERCENT" | "FIXED";

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
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  /** Coste interno de la empresa para esta línea (p.ej. salarios), nunca visible al cliente. */
  companyCost?: number | null;
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
  rotEnabled: boolean;
  rotPercent: number;
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
  costInternal: number;
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

  rotDeduction: number;
  totalDue: number;

  // Solo para uso interno de la empresa — nunca debe mostrarse en el PDF de cliente.
  totalCostInternal: number;
  grossProfit: number;
  marginPercent: number;
}
