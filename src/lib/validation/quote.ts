import { z } from "zod";

import { PRICING_METHODS, WORK_UNITS } from "./price-list";
import { MATERIAL_UNITS } from "./material";

export const DISCOUNT_TYPES = ["NONE", "PERCENT", "FIXED"] as const;
export const QUOTE_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
] as const;
export const MEASUREMENT_SOURCES = [
  "NONE",
  "NET_WALL",
  "GROSS_WALL",
  "CEILING",
  "FLOOR",
  "PERIMETER",
] as const;
export const MATERIAL_CALC_TYPES = ["NONE", "PAINT", "COVERAGE", "PACKAGE"] as const;
export const OPENING_TYPES = ["DOOR", "WINDOW", "OTHER"] as const;

export const roomOpeningSchema = z.object({
  id: z.string().optional(),
  type: z.enum(OPENING_TYPES).default("DOOR"),
  width: z.coerce.number().min(0),
  height: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(1).default(1),
});

export const roomSchema = z.object({
  id: z.string().optional(),
  // Una habitación recién añadida empieza sin nombre (el usuario lo rellena
  // después, p.ej. "Salón"), así que no puede exigirse aquí: si se exigiera,
  // el autoguardado fallaría en cuanto se añade una habitación.
  name: z.string().default(""),
  length: z.coerce.number().min(0),
  width: z.coerce.number().min(0),
  height: z.coerce.number().min(0),
  openings: z.array(roomOpeningSchema).default([]),
});

export const quoteMaterialSchema = z.object({
  id: z.string().optional(),
  materialLibraryItemId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0),
  unit: z.enum(MATERIAL_UNITS),
  purchasePrice: z.coerce.number().min(0),
  marginPercent: z.coerce.number().min(0),
  calcType: z.enum(MATERIAL_CALC_TYPES).default("NONE"),
  coveragePerUnit: z.coerce.number().min(0).optional().nullable(),
  coats: z.coerce.number().int().min(1).optional().nullable(),
  wastePercent: z.coerce.number().min(0).default(0),
  packageSize: z.coerce.number().min(0).optional().nullable(),
  containerSizes: z.array(z.coerce.number().min(0)).optional().nullable(),
  calculatedQuantity: z.coerce.number().min(0).optional().nullable(),
});

export const quoteItemSchema = z.object({
  id: z.string().optional(),
  priceListItemId: z.string().optional().nullable(),
  categoryName: z.string().optional().nullable(),
  // Un trabajo personalizado ("+ Agregar trabajo personalizado") empieza sin
  // nombre y se autoguarda antes de que el usuario lo rellene, así que no
  // puede exigirse aquí (rompería el autoguardado justo al añadirlo).
  name: z.string().default(""),
  descriptionInternal: z.string().optional().nullable(),
  descriptionClient: z.string().optional().nullable(),
  pricingMethod: z.enum(PRICING_METHODS),
  unit: z.enum(WORK_UNITS),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  useDetailedLabor: z.boolean().default(false),
  workerCount: z.coerce.number().min(0).optional().nullable(),
  hoursPerWorker: z.coerce.number().min(0).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  internalHourlyRate: z.coerce.number().min(0).optional().nullable(),
  discountType: z.enum(DISCOUNT_TYPES).default("NONE"),
  discountValue: z.coerce.number().min(0).default(0),
  companyCost: z.coerce.number().min(0).optional().nullable(),
  rotEligible: z.boolean().default(true),
  measurementSource: z.enum(MEASUREMENT_SOURCES).default("NONE"),
  subtractOpeningWidths: z.boolean().default(false),
  roomIds: z.array(z.string()).default([]),
  materials: z.array(quoteMaterialSchema).default([]),
});

export const quoteOtherCostSchema = z.object({
  id: z.string().optional(),
  // Igual que en items/habitaciones: se crea vacío y se rellena después.
  name: z.string().default(""),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
});

export const quoteUpdateSchema = z.object({
  status: z.enum(QUOTE_STATUSES).optional(),
  customerId: z.string().optional(),
  projectId: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
  projectDescription: z.string().optional().nullable(),
  siteAddressDifferent: z.boolean().optional(),
  siteAddress: z.string().optional().nullable(),
  sitePostalCode: z.string().optional().nullable(),
  siteCity: z.string().optional().nullable(),
  quoteDate: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional().nullable(),
  currency: z.string().optional(),
  vatRatePercent: z.coerce.number().min(0).optional(),
  rotEnabled: z.boolean().optional(),
  rotPercent: z.coerce.number().min(0).optional(),
  discountType: z.enum(DISCOUNT_TYPES).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  materialMarginDefaultPercent: z.coerce.number().min(0).optional(),
  showHours: z.boolean().optional(),
  showHourlyRate: z.boolean().optional(),
  showMaterialsIndividually: z.boolean().optional(),
  showMaterialPrices: z.boolean().optional(),
  showUnitPrice: z.boolean().optional(),
  showOnlyTotalPerJob: z.boolean().optional(),
  showMaterialsOnPdf: z.boolean().optional(),
  includedText: z.string().optional().nullable(),
  excludedText: z.string().optional().nullable(),
  termsText: z.string().optional().nullable(),
  notesInternal: z.string().optional().nullable(),
  notesClient: z.string().optional().nullable(),
  rooms: z.array(roomSchema).optional(),
  items: z.array(quoteItemSchema).optional(),
  otherCosts: z.array(quoteOtherCostSchema).optional(),
});

export type RoomInput = z.infer<typeof roomSchema>;
export type RoomOpeningInput = z.infer<typeof roomOpeningSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
export type QuoteMaterialInput = z.infer<typeof quoteMaterialSchema>;
export type QuoteOtherCostInput = z.infer<typeof quoteOtherCostSchema>;
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>;
