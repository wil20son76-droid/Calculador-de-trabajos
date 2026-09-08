import { z } from "zod";

// Datos de perfil de empresa (nombre, dirección, pagos...) se conservan en la
// base de datos para una futura integración con Fortnox, pero ya no forman
// parte de la Configuración de esta herramienta interna de cálculo.
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
  locale: z.string().min(1),
  vatRatePercent: z.coerce.number().min(0),
  rotEnabledDefault: z.boolean(),
  rotPercent: z.coerce.number().min(0),
  rotMaxDeductionPerQuote: z.coerce.number().min(0).optional().nullable(),
  defaultHourlyRate: z.coerce.number().min(0),
  defaultInternalHourlyRate: z.coerce.number().min(0),
  defaultMaterialMarginPercent: z.coerce.number().min(0),
  defaultWastePercent: z.coerce.number().min(0),
  quoteValidityDays: z.coerce.number().min(1),
  defaultTermsText: z.string().optional().nullable(),
});

export type CompanyInput = z.infer<typeof companySchema>;

// Subconjunto editable desde la pantalla de Configuración simplificada:
// solo los valores por defecto que usa el motor de cálculo (moms, ROT,
// costes/precios por hora, margen y desperdicio predeterminados, idioma,
// moneda). El resto de campos de la empresa (nombre, dirección, pagos...)
// se mantienen en la base de datos para una futura integración con Fortnox.
export const calcSettingsSchema = companySchema.pick({
  currency: true,
  locale: true,
  vatRatePercent: true,
  rotEnabledDefault: true,
  rotPercent: true,
  rotMaxDeductionPerQuote: true,
  defaultHourlyRate: true,
  defaultInternalHourlyRate: true,
  defaultMaterialMarginPercent: true,
  defaultWastePercent: true,
});

export type CalcSettingsInput = z.infer<typeof calcSettingsSchema>;
