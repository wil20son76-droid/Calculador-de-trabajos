import { z } from "zod";

export const customerSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  personalOrgNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
