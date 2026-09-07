import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "El nombre de la empresa es obligatorio"),
  orgNumber: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  bankgiro: z.string().optional().nullable(),
  plusgiro: z.string().optional().nullable(),
  swish: z.string().optional().nullable(),
  currency: z.string().min(1),
  vatRatePercent: z.coerce.number().min(0),
  rotEnabledDefault: z.boolean(),
  rotPercent: z.coerce.number().min(0),
  rotMaxDeductionPerQuote: z.coerce.number().min(0).optional().nullable(),
  defaultHourlyRate: z.coerce.number().min(0),
  defaultMaterialMarginPercent: z.coerce.number().min(0),
  quoteValidityDays: z.coerce.number().min(1),
  defaultTermsText: z.string().optional().nullable(),
});

export type CompanyInput = z.infer<typeof companySchema>;
