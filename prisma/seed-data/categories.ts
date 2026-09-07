// Biblioteca de trabajos por categoría (sección 2 y 3 de la especificación).
// pricingMethod y unit definen cómo se calcula cada línea por defecto; el usuario
// puede cambiarlo en cada presupuesto.

export type SeedPricingMethod = "FIXED" | "HOURLY" | "PER_M2" | "PER_METER" | "PER_UNIT" | "PER_DAY";
export type SeedWorkUnit =
  | "UNIT"
  | "HOUR"
  | "M2"
  | "M3"
  | "METER"
  | "DAY"
  | "KG"
  | "TON"
  | "LITER"
  | "BAG"
  | "PACKAGE"
  | "BOX"
  | "ROLL";

export interface SeedJobItem {
  name: string;
  nameSv?: string;
  pricingMethod: SeedPricingMethod;
  unit: SeedWorkUnit;
  defaultUnitPrice: number;
  defaultHourlyRate?: number;
}

export interface SeedCategory {
  key: string;
  name: string;
  nameSv: string;
  jobs: SeedJobItem[];
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    key: "painting-interior",
    name: "Pintura interior",
    nameSv: "Målning inomhus",
    jobs: [
      { name: "Pintura de paredes", nameSv: "Väggmålning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 150 },
      { name: "Pintura de techo", nameSv: "Takmålning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 180 },
      { name: "Pintura de puertas", nameSv: "Dörrmålning", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 650 },
      { name: "Pintura de ventanas", nameSv: "Fönstermålning", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 550 },
      { name: "Pintura de molduras", nameSv: "Listmålning", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 45 },
      { name: "Pintura de zócalos", nameSv: "Golvsockelmålning", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 40 },
      { name: "Empapelado", nameSv: "Tapetsering", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 220 },
      { name: "Retirada de papel pintado", nameSv: "Tapetborttagning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 90 },
      { name: "Spackling / masillado", nameSv: "Spackling", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 600, defaultHourlyRate: 600 },
      { name: "Lijado", nameSv: "Slipning", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 550, defaultHourlyRate: 550 },
      { name: "Imprimación", nameSv: "Grundmålning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 60 },
      { name: "Reparación de paredes", nameSv: "Väggreparation", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 600, defaultHourlyRate: 600 },
    ],
  },
  {
    key: "painting-exterior",
    name: "Pintura exterior",
    nameSv: "Målning utomhus",
    jobs: [
      { name: "Pintura de fachada", nameSv: "Fasadmålning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 220 },
      { name: "Lavado de fachada", nameSv: "Fasadtvätt", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 45 },
      { name: "Raspado de pintura", nameSv: "Skrapning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 80 },
      { name: "Pintura de ventanas", nameSv: "Fönstermålning ute", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 650 },
      { name: "Pintura de puertas", nameSv: "Dörrmålning ute", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 750 },
      { name: "Pintura de aleros", nameSv: "Takfotsmålning", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 95 },
      { name: "Pintura de fascia", nameSv: "Vindskivemålning", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 95 },
      { name: "Pintura de terraza", nameSv: "Altanmålning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 180 },
      { name: "Pintura de vallas", nameSv: "Staketmålning", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 120 },
      { name: "Andamio", nameSv: "Byggnadsställning", pricingMethod: "FIXED", unit: "UNIT", defaultUnitPrice: 4500 },
      { name: "Trabajo en altura", nameSv: "Höjdarbete", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 700, defaultHourlyRate: 700 },
    ],
  },
  {
    key: "floors",
    name: "Suelos",
    nameSv: "Golv",
    jobs: [
      { name: "Lijado de parquet", nameSv: "Parkettslipning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 250 },
      { name: "Barnizado", nameSv: "Lackning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 150 },
      { name: "Aceitado", nameSv: "Oljning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 140 },
      { name: "Colocación de parquet", nameSv: "Parkettläggning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 450 },
      { name: "Colocación de fiskbensparkett", nameSv: "Fiskbensparkettläggning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 650 },
      { name: "Colocación de laminado", nameSv: "Laminatläggning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 250 },
      { name: "Colocación de suelo de madera", nameSv: "Trägolvläggning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 480 },
      { name: "Retirada de suelo antiguo", nameSv: "Golvrivning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 90 },
      { name: "Instalación de rodapiés", nameSv: "Golvsockelmontage", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 75 },
      { name: "Fris", nameSv: "Fris", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 180 },
      { name: "Stav", nameSv: "Stav", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 160 },
      { name: "Corte 45°", nameSv: "45-graders kapning", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 650, defaultHourlyRate: 650 },
      { name: "Reparación de parquet", nameSv: "Parkettreparation", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 650, defaultHourlyRate: 650 },
      { name: "Nivelación del suelo", nameSv: "Golvutjämning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 120 },
    ],
  },
  {
    key: "kitchen",
    name: "Renovación de cocina",
    nameSv: "Köksrenovering",
    jobs: [
      { name: "Demolición de cocina", nameSv: "Rivning kök", pricingMethod: "FIXED", unit: "UNIT", defaultUnitPrice: 8500 },
      { name: "Retirada de muebles", nameSv: "Borttagning av skåp", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 550, defaultHourlyRate: 550 },
      { name: "Montaje de muebles IKEA", nameSv: "IKEA-köksmontage", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 650, defaultHourlyRate: 650 },
      { name: "Montaje de armarios", nameSv: "Skåpsmontage", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 650, defaultHourlyRate: 650 },
      { name: "Instalación de encimera", nameSv: "Bänkskivemontage", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 950 },
      { name: "Instalación de electrodomésticos", nameSv: "Vitvaruinstallation", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 1200 },
      { name: "Alicatado", nameSv: "Kakelsättning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 850 },
      { name: "Pintura", nameSv: "Målning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 150 },
      { name: "Pladur", nameSv: "Gipsskivor", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 380 },
      { name: "Electricidad", nameSv: "Elarbete", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 750, defaultHourlyRate: 750 },
      { name: "Fontanería", nameSv: "VVS-arbete", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 750, defaultHourlyRate: 750 },
      { name: "Instalación de iluminación", nameSv: "Belysningsinstallation", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 650 },
      { name: "Techo falso", nameSv: "Undertak", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 420 },
      { name: "Preparación de paredes", nameSv: "Väggförberedelse", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 90 },
    ],
  },
  {
    key: "bathroom",
    name: "Renovación de baño",
    nameSv: "Badrumsrenovering",
    jobs: [
      { name: "Demolición", nameSv: "Rivning", pricingMethod: "FIXED", unit: "UNIT", defaultUnitPrice: 9500 },
      { name: "Impermeabilización", nameSv: "Tätskikt", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 650 },
      { name: "Alicatado", nameSv: "Kakelsättning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 950 },
      { name: "Suelo", nameSv: "Golvläggning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 750 },
      { name: "Plomería", nameSv: "VVS-arbete", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 750, defaultHourlyRate: 750 },
      { name: "Electricidad", nameSv: "Elarbete", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 750, defaultHourlyRate: 750 },
      { name: "Pintura", nameSv: "Målning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 180 },
      { name: "Montaje de muebles", nameSv: "Möbelmontage", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 650, defaultHourlyRate: 650 },
      { name: "Instalación sanitaria", nameSv: "Sanitetsinstallation", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 2200 },
    ],
  },
  {
    key: "carpentry",
    name: "Carpintería",
    nameSv: "Snickeri",
    jobs: [
      { name: "Construcción de tabiques", nameSv: "Väggreglar", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 650 },
      { name: "Montaje de puertas", nameSv: "Dörrmontage", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 1500 },
      { name: "Montaje de ventanas", nameSv: "Fönstermontage", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 2200 },
      { name: "Rodapiés", nameSv: "Golvsocklar", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 85 },
      { name: "Molduras", nameSv: "Lister", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 90 },
      { name: "Paneles", nameSv: "Panel", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 450 },
      { name: "Armarios", nameSv: "Garderober", pricingMethod: "FIXED", unit: "UNIT", defaultUnitPrice: 8500 },
      { name: "Reparaciones", nameSv: "Reparationer", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 650, defaultHourlyRate: 650 },
    ],
  },
  {
    key: "terrace",
    name: "Terrazas / Altan",
    nameSv: "Altan",
    jobs: [
      { name: "Construcción de estructura", nameSv: "Stomresning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 850 },
      { name: "Reglar", nameSv: "Reglar", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 250 },
      { name: "Plint", nameSv: "Plintläggning", pricingMethod: "PER_UNIT", unit: "UNIT", defaultUnitPrice: 450 },
      { name: "Montaje de tarima", nameSv: "Trallmontage", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 450 },
      { name: "Kebony", nameSv: "Kebony", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 550 },
      { name: "Composite", nameSv: "Komposittrall", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 600 },
      { name: "Trall impregnado", nameSv: "Tryckimpregnerad trall", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 400 },
      { name: "Escaleras", nameSv: "Trappor", pricingMethod: "FIXED", unit: "UNIT", defaultUnitPrice: 6500 },
      { name: "Barandillas", nameSv: "Räcken", pricingMethod: "PER_METER", unit: "METER", defaultUnitPrice: 950 },
      { name: "Demolición", nameSv: "Rivning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 120 },
      { name: "Preparación del terreno", nameSv: "Markberedning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 180 },
    ],
  },
  {
    key: "general-renovation",
    name: "Reforma general",
    nameSv: "Totalrenovering",
    jobs: [
      { name: "Demolición", nameSv: "Rivning", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 600, defaultHourlyRate: 600 },
      { name: "Retirada de residuos", nameSv: "Bortforsling av avfall", pricingMethod: "FIXED", unit: "UNIT", defaultUnitPrice: 3500 },
      { name: "Transporte", nameSv: "Transport", pricingMethod: "FIXED", unit: "UNIT", defaultUnitPrice: 1500 },
      { name: "Protección de superficies", nameSv: "Ytskydd", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 25 },
      { name: "Limpieza", nameSv: "Städning", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 450, defaultHourlyRate: 450 },
      { name: "Pladur", nameSv: "Gipsskivor", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 380 },
      { name: "Aislamiento", nameSv: "Isolering", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 220 },
      { name: "Electricidad", nameSv: "Elarbete", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 750, defaultHourlyRate: 750 },
      { name: "Fontanería", nameSv: "VVS-arbete", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 750, defaultHourlyRate: 750 },
      { name: "Carpintería", nameSv: "Snickeri", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 650, defaultHourlyRate: 650 },
      { name: "Pintura", nameSv: "Målning", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 150 },
      { name: "Suelos", nameSv: "Golvarbete", pricingMethod: "PER_M2", unit: "M2", defaultUnitPrice: 350 },
      { name: "Acabados", nameSv: "Finish", pricingMethod: "HOURLY", unit: "HOUR", defaultUnitPrice: 600, defaultHourlyRate: 600 },
    ],
  },
];
