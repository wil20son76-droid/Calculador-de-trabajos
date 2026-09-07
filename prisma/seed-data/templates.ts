import type { SeedPricingMethod, SeedWorkUnit } from "./categories";

export interface SeedTemplateItem {
  name: string;
  descriptionClient?: string;
  pricingMethod: SeedPricingMethod;
  unit: SeedWorkUnit;
  quantity: number;
  unitPrice: number;
}

export interface SeedTemplate {
  name: string;
  description: string;
  items: SeedTemplateItem[];
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    name: "Pintura apartamento",
    description: "Pintura completa de paredes y techos de un apartamento estándar",
    items: [
      { name: "Pintura de paredes", pricingMethod: "PER_M2", unit: "M2", quantity: 100, unitPrice: 150 },
      { name: "Pintura de techo", pricingMethod: "PER_M2", unit: "M2", quantity: 60, unitPrice: 180 },
      { name: "Spackling / masillado", pricingMethod: "HOURLY", unit: "HOUR", quantity: 8, unitPrice: 600 },
    ],
  },
  {
    name: "Renovación cocina",
    description: "Reforma completa de cocina: demolición, muebles, electricidad y acabados",
    items: [
      { name: "Demolición de cocina", pricingMethod: "FIXED", unit: "UNIT", quantity: 1, unitPrice: 8500 },
      { name: "Montaje de muebles IKEA", pricingMethod: "HOURLY", unit: "HOUR", quantity: 16, unitPrice: 650 },
      { name: "Instalación de encimera", pricingMethod: "PER_METER", unit: "METER", quantity: 4, unitPrice: 950 },
      { name: "Alicatado", pricingMethod: "PER_M2", unit: "M2", quantity: 8, unitPrice: 850 },
      { name: "Electricidad", pricingMethod: "HOURLY", unit: "HOUR", quantity: 10, unitPrice: 750 },
    ],
  },
  {
    name: "Renovación baño",
    description: "Reforma completa de baño con impermeabilización y alicatado",
    items: [
      { name: "Demolición", pricingMethod: "FIXED", unit: "UNIT", quantity: 1, unitPrice: 9500 },
      { name: "Impermeabilización", pricingMethod: "PER_M2", unit: "M2", quantity: 12, unitPrice: 650 },
      { name: "Alicatado", pricingMethod: "PER_M2", unit: "M2", quantity: 20, unitPrice: 950 },
      { name: "Plomería", pricingMethod: "HOURLY", unit: "HOUR", quantity: 12, unitPrice: 750 },
      { name: "Instalación sanitaria", pricingMethod: "PER_UNIT", unit: "UNIT", quantity: 3, unitPrice: 2200 },
    ],
  },
  {
    name: "Lijado parquet",
    description: "Lijado, preparación y barnizado de suelo de parquet existente",
    items: [
      { name: "Lijado de parquet", pricingMethod: "PER_M2", unit: "M2", quantity: 60, unitPrice: 250 },
      { name: "Barnizado", pricingMethod: "PER_M2", unit: "M2", quantity: 60, unitPrice: 150 },
    ],
  },
  {
    name: "Colocación fiskbensparkett",
    description: "Colocación de parquet en espiga con fris y corte a 45°",
    items: [
      { name: "Colocación de fiskbensparkett", pricingMethod: "PER_M2", unit: "M2", quantity: 70, unitPrice: 650 },
      { name: "Fris", pricingMethod: "PER_METER", unit: "METER", quantity: 30, unitPrice: 180 },
      { name: "Corte 45°", pricingMethod: "HOURLY", unit: "HOUR", quantity: 6, unitPrice: 650 },
      { name: "Barnizado", pricingMethod: "PER_M2", unit: "M2", quantity: 70, unitPrice: 150 },
    ],
  },
  {
    name: "Construcción terraza",
    description: "Terraza/altan completa: estructura, tarima y barandillas",
    items: [
      { name: "Construcción de estructura", pricingMethod: "PER_M2", unit: "M2", quantity: 25, unitPrice: 850 },
      { name: "Montaje de tarima", pricingMethod: "PER_M2", unit: "M2", quantity: 25, unitPrice: 450 },
      { name: "Barandillas", pricingMethod: "PER_METER", unit: "METER", quantity: 10, unitPrice: 950 },
    ],
  },
  {
    name: "Pintura fachada",
    description: "Lavado, raspado y pintura completa de fachada exterior",
    items: [
      { name: "Lavado de fachada", pricingMethod: "PER_M2", unit: "M2", quantity: 150, unitPrice: 45 },
      { name: "Raspado de pintura", pricingMethod: "PER_M2", unit: "M2", quantity: 150, unitPrice: 80 },
      { name: "Pintura de fachada", pricingMethod: "PER_M2", unit: "M2", quantity: 150, unitPrice: 220 },
      { name: "Andamio", pricingMethod: "FIXED", unit: "UNIT", quantity: 1, unitPrice: 4500 },
    ],
  },
];
