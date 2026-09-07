import { z } from "zod";

import { PRICING_METHODS, WORK_UNITS } from "./price-list";

export const templateItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  descriptionClient: z.string().optional().nullable(),
  pricingMethod: z.enum(PRICING_METHODS),
  unit: z.enum(WORK_UNITS),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
});

export const templateSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional().nullable(),
  items: z.array(templateItemSchema).default([]),
});

export type TemplateItemInput = z.infer<typeof templateItemSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
