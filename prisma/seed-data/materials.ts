export type SeedMaterialUnit =
  | "UNIT"
  | "METER"
  | "M2"
  | "M3"
  | "KG"
  | "TON"
  | "LITER"
  | "BAG"
  | "PACKAGE"
  | "BOX"
  | "ROLL";

export type SeedMaterialCalcType = "NONE" | "PAINT" | "COVERAGE" | "PACKAGE";

export interface SeedMaterial {
  name: string;
  description?: string;
  unit: SeedMaterialUnit;
  purchasePrice: number;
  marginPercent: number;
  supplier?: string;
  /** Cálculo automático a partir de la medición de la línea (calculador de habitaciones). */
  calcType?: SeedMaterialCalcType;
  coveragePerUnit?: number; // rendimiento m²/L (PAINT) o consumo por m² (COVERAGE)
  coatsDefault?: number;
  wastePercentDefault?: number;
  packageSize?: number; // tamaño de envase/paquete en la unidad natural (L, kg, m²)
  containerSizes?: number[]; // tamaños de envase disponibles (pintura/barniz)
}

export const SEED_MATERIALS: SeedMaterial[] = [
  // Pinturas y barnices: unidad natural = litro, precio por litro. calcType PAINT
  // usa rendimiento (m²/L) + manos, con sugerencia de combinación de envases.
  {
    name: "Takfärg",
    description: "Pintura de techo blanca mate",
    unit: "LITER",
    purchasePrice: 109.5,
    marginPercent: 15,
    supplier: "Bauhaus",
    calcType: "PAINT",
    coveragePerUnit: 8,
    coatsDefault: 2,
    wastePercentDefault: 10,
    containerSizes: [1, 2.7, 5, 9, 10],
  },
  {
    name: "Väggfärg",
    description: "Pintura de pared lavable",
    unit: "LITER",
    purchasePrice: 125,
    marginPercent: 15,
    supplier: "Bauhaus",
    calcType: "PAINT",
    coveragePerUnit: 7,
    coatsDefault: 2,
    wastePercentDefault: 10,
    containerSizes: [1, 2.7, 5, 9, 10],
  },
  {
    name: "Fasadfärg",
    description: "Pintura de fachada exterior",
    unit: "LITER",
    purchasePrice: 165,
    marginPercent: 15,
    supplier: "Beckers",
    calcType: "PAINT",
    coveragePerUnit: 6,
    coatsDefault: 2,
    wastePercentDefault: 15,
    containerSizes: [1, 2.7, 5, 9, 10],
  },
  {
    name: "Grundfärg",
    description: "Imprimación",
    unit: "LITER",
    purchasePrice: 89.5,
    marginPercent: 15,
    supplier: "Bauhaus",
    calcType: "PAINT",
    coveragePerUnit: 10,
    coatsDefault: 1,
    wastePercentDefault: 10,
    containerSizes: [1, 2.7, 5, 9, 10],
  },
  {
    name: "Golvolja",
    description: "Aceite para suelos de madera",
    unit: "LITER",
    purchasePrice: 210,
    marginPercent: 15,
    supplier: "Bona",
    calcType: "PAINT",
    coveragePerUnit: 12,
    coatsDefault: 2,
    wastePercentDefault: 5,
    containerSizes: [1, 2.5, 5],
  },
  { name: "Spackel 5kg", description: "Masilla para paredes", unit: "UNIT", purchasePrice: 245, marginPercent: 15, supplier: "Bauhaus" },
  { name: "Slippapper (paket)", description: "Papel de lija, paquete", unit: "PACKAGE", purchasePrice: 150, marginPercent: 15, supplier: "Bauhaus" },

  // Suelos: unidad natural = m², calcType PACKAGE (paquetes indivisibles, Math.ceil)
  {
    name: "Parkett Ek 3-stav",
    description: "Parquet de roble 3 tablillas",
    unit: "M2",
    purchasePrice: 380,
    marginPercent: 20,
    supplier: "Golvpoolen",
    calcType: "PACKAGE",
    wastePercentDefault: 5,
    packageSize: 2.2,
  },
  {
    name: "Fiskbensparkett Ek",
    description: "Parquet espiga de roble",
    unit: "M2",
    purchasePrice: 550,
    marginPercent: 20,
    supplier: "Golvpoolen",
    calcType: "PACKAGE",
    wastePercentDefault: 10,
    packageSize: 1.8,
  },
  {
    name: "Laminatgolv",
    description: "Suelo laminado",
    unit: "M2",
    purchasePrice: 180,
    marginPercent: 20,
    supplier: "Golvpoolen",
    calcType: "PACKAGE",
    wastePercentDefault: 5,
    packageSize: 2.4,
  },

  // Materiales auxiliares de suelo: consumo por m² (kg o L / m²)
  {
    name: "Parkettlim",
    description: "Pegamento para parquet",
    unit: "KG",
    purchasePrice: 30,
    marginPercent: 15,
    supplier: "Golvpoolen",
    calcType: "COVERAGE",
    coveragePerUnit: 1.2,
    wastePercentDefault: 0,
    packageSize: 15,
  },
  {
    name: "Parkettlack",
    description: "Barniz para parquet",
    unit: "LITER",
    purchasePrice: 220,
    marginPercent: 15,
    supplier: "Golvpoolen",
    calcType: "PAINT",
    coveragePerUnit: 10,
    coatsDefault: 3,
    wastePercentDefault: 5,
    containerSizes: [1, 2.5, 5, 10],
  },
  {
    name: "Underlag",
    description: "Base amortiguadora para laminado/parquet flotante",
    unit: "M2",
    purchasePrice: 25,
    marginPercent: 15,
    supplier: "Golvpoolen",
    calcType: "COVERAGE",
    coveragePerUnit: 1,
    wastePercentDefault: 5,
  },
  {
    name: "Fuktspärr",
    description: "Barrera de humedad para suelos",
    unit: "M2",
    purchasePrice: 18,
    marginPercent: 15,
    supplier: "Beijer",
    calcType: "COVERAGE",
    coveragePerUnit: 1,
    wastePercentDefault: 10,
  },
  {
    name: "Golvspackel",
    description: "Masilla niveladora de suelo (por kg)",
    unit: "KG",
    purchasePrice: 12,
    marginPercent: 15,
    supplier: "Beijer",
    calcType: "COVERAGE",
    coveragePerUnit: 1.5,
    wastePercentDefault: 5,
    packageSize: 20,
  },
  {
    name: "Golvsockel MDF",
    description: "Rodapié MDF",
    unit: "METER",
    purchasePrice: 45,
    marginPercent: 20,
    supplier: "Beijer",
    calcType: "COVERAGE",
    coveragePerUnit: 1,
    wastePercentDefault: 8,
  },

  { name: "Regel 45x120", description: "Listón estructural de madera", unit: "METER", purchasePrice: 35, marginPercent: 15, supplier: "Beijer" },
  { name: "Regel 45x70", description: "Listón estructural de madera", unit: "METER", purchasePrice: 22, marginPercent: 15, supplier: "Beijer" },
  { name: "Kakel 20x20", description: "Azulejo de baño", unit: "M2", purchasePrice: 280, marginPercent: 20, supplier: "Kakelspecialisten" },
  { name: "Klinker 30x60", description: "Gres porcelánico para suelo", unit: "M2", purchasePrice: 350, marginPercent: 20, supplier: "Kakelspecialisten" },
  { name: "Fix och fog (säck)", description: "Cemento cola y junta", unit: "BAG", purchasePrice: 195, marginPercent: 15, supplier: "Beijer" },
  { name: "Tätskikt (våtrumssystem)", description: "Sistema de impermeabilización", unit: "M2", purchasePrice: 220, marginPercent: 15, supplier: "Mataki" },
  { name: "Gipsskiva 13mm", description: "Placa de pladur", unit: "UNIT", purchasePrice: 145, marginPercent: 15, supplier: "Beijer" },
  { name: "Isolering 95mm", description: "Aislamiento de lana mineral", unit: "M2", purchasePrice: 95, marginPercent: 15, supplier: "Beijer" },
  { name: "Skruv (låda)", description: "Caja de tornillos", unit: "BOX", purchasePrice: 180, marginPercent: 10, supplier: "Beijer" },
  { name: "Tapet (rulle)", description: "Rollo de papel pintado", unit: "ROLL", purchasePrice: 450, marginPercent: 20, supplier: "Bauhaus" },
];
