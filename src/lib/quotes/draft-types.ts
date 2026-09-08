import type {
  DiscountType,
  PricingMethod,
  WorkUnit,
  MaterialUnit,
  MeasurementSource,
  MaterialCalcType,
  OpeningType,
} from "@prisma/client";

export interface MaterialDraft {
  id: string;
  materialLibraryItemId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit: MaterialUnit;
  purchasePrice: number;
  marginPercent: number;
  calcType: MaterialCalcType;
  coveragePerUnit?: number | null;
  coats?: number | null;
  wastePercent: number;
  packageSize?: number | null;
  containerSizes?: number[] | null;
  calculatedQuantity?: number | null;
}

export interface ItemDraft {
  id: string;
  priceListItemId?: string | null;
  categoryName?: string | null;
  name: string;
  descriptionInternal?: string | null;
  descriptionClient?: string | null;
  pricingMethod: PricingMethod;
  unit: WorkUnit;
  quantity: number;
  unitPrice: number;
  useDetailedLabor: boolean;
  workerCount?: number | null;
  hoursPerWorker?: number | null;
  hourlyRate?: number | null;
  internalHourlyRate?: number | null;
  discountType: DiscountType;
  discountValue: number;
  companyCost?: number | null;
  /** ROT-berättigad: si la mano de obra de este trabajo es elegible para el ROT-avdrag. */
  rotEligible: boolean;
  measurementSource: MeasurementSource;
  subtractOpeningWidths: boolean;
  roomIds: string[];
  materials: MaterialDraft[];
}

export interface OtherCostDraft {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface RoomOpeningDraft {
  id: string;
  type: OpeningType;
  width: number;
  height: number;
  quantity: number;
}

export interface RoomDraft {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  openings: RoomOpeningDraft[];
}

export interface QuoteDraft {
  projectName: string;
  siteAddress: string;
  notesInternal: string;
  quoteDate: string;
  currency: string;
  vatRatePercent: number;
  rotEnabled: boolean;
  rotPercent: number;
  discountType: DiscountType;
  discountValue: number;
  materialMarginDefaultPercent: number;
  rooms: RoomDraft[];
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
    calcType: "NONE",
    wastePercent: 0,
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
    rotEligible: true,
    measurementSource: "NONE",
    subtractOpeningWidths: false,
    roomIds: [],
    materials: [],
  };
}

export function emptyOtherCost(): OtherCostDraft {
  return { id: newId("cost"), name: "", quantity: 1, unitPrice: 0 };
}

export function emptyRoom(): RoomDraft {
  return { id: newId("room"), name: "", length: 0, width: 0, height: 2.5, openings: [] };
}

export function emptyOpening(type: OpeningType = "DOOR"): RoomOpeningDraft {
  return {
    id: newId("opening"),
    type,
    width: type === "DOOR" ? 0.9 : 1.2,
    height: type === "DOOR" ? 2.1 : 1.2,
    quantity: 1,
  };
}
