import { z } from "zod";

export const PRICING_METHODS = ["FIXED", "HOURLY", "PER_M2", "PER_METER", "PER_UNIT", "PER_DAY"] as const;
export const WORK_UNITS = [
  "UNIT",
  "HOUR",
  "M2",
  "M3",
  "METER",
  "DAY",
  "KG",
  "TON",
  "LITER",
  "BAG",
  "PACKAGE",
  "BOX",
  "ROLL",
] as const;

export const priceListItemSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  nameSv: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  pricingMethod: z.enum(PRICING_METHODS),
  unit: z.enum(WORK_UNITS),
  defaultUnitPrice: z.coerce.number().min(0),
  defaultHourlyRate: z.coerce.number().min(0).optional().nullable(),
});

export type PriceListItemInput = z.infer<typeof priceListItemSchema>;
