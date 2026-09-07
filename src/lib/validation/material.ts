import { z } from "zod";

export const MATERIAL_UNITS = [
  "UNIT",
  "METER",
  "M2",
  "M3",
  "KG",
  "TON",
  "LITER",
  "BAG",
  "PACKAGE",
  "BOX",
  "ROLL",
] as const;

export const materialLibraryItemSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional().nullable(),
  unit: z.enum(MATERIAL_UNITS),
  purchasePrice: z.coerce.number().min(0),
  marginPercent: z.coerce.number().min(0),
  supplier: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
});

export type MaterialLibraryItemInput = z.infer<typeof materialLibraryItemSchema>;
