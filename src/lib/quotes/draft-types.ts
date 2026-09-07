import type { DiscountType, PricingMethod, WorkUnit, MaterialUnit } from "@prisma/client";

export interface MaterialDraft {
  id: string;
  materialLibraryItemId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit: MaterialUnit;
  purchasePrice: number;
  marginPercent: number;
}

export interface ItemDraft {
  id: string;
  priceListItemId?: string | null;
  categoryName?: string | null;
  name: string;
  descriptionInternal?: string | null;
  descriptionClient?: string | null;
  includedText?: string | null;
  excludedText?: string | null;
  pricingMethod: PricingMethod;
  unit: WorkUnit;
  quantity: number;
  unitPrice: number;
  useDetailedLabor: boolean;
  workerCount?: number | null;
  hoursPerWorker?: number | null;
  hourlyRate?: number | null;
  discountType: DiscountType;
  discountValue: number;
  companyCost?: number | null;
  materials: MaterialDraft[];
}

export interface OtherCostDraft {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteDraft {
  status: string;
  customerId: string;
  projectName: string;
  projectDescription: string;
  siteAddressDifferent: boolean;
  siteAddress: string;
  sitePostalCode: string;
  siteCity: string;
  quoteDate: string;
  validUntil: string;
  currency: string;
  vatRatePercent: number;
  rotEnabled: boolean;
  rotPercent: number;
  discountType: DiscountType;
  discountValue: number;
  materialMarginDefaultPercent: number;
  showHours: boolean;
  showHourlyRate: boolean;
  showMaterialsIndividually: boolean;
  showMaterialPrices: boolean;
  showUnitPrice: boolean;
  showOnlyTotalPerJob: boolean;
  showMaterialsOnPdf: boolean;
  includedText: string;
  excludedText: string;
  termsText: string;
  notesInternal: string;
  notesClient: string;
  items: ItemDraft[];
  otherCosts: OtherCostDraft[];
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `tmp-${prefix}-${Date.now()}-${counter}`;
}

export function emptyMaterial(): MaterialDraft {
  return {
    id: newId("mat"),
    name: "",
    quantity: 1,
    unit: "UNIT",
    purchasePrice: 0,
    marginPercent: 15,
  };
}

export function emptyItem(): ItemDraft {
  return {
    id: newId("item"),
    name: "",
    pricingMethod: "FIXED",
    unit: "UNIT",
    quantity: 1,
    unitPrice: 0,
    useDetailedLabor: false,
    discountType: "NONE",
    discountValue: 0,
    materials: [],
  };
}

export function emptyOtherCost(): OtherCostDraft {
  return { id: newId("cost"), name: "", quantity: 1, unitPrice: 0 };
}
