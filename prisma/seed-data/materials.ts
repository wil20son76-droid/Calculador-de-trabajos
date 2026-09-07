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

export interface SeedMaterial {
  name: string;
  description?: string;
  unit: SeedMaterialUnit;
  purchasePrice: number;
  marginPercent: number;
  supplier?: string;
}

export const SEED_MATERIALS: SeedMaterial[] = [
  { name: "Takfärg 10L", description: "Pintura de techo blanca mate", unit: "UNIT", purchasePrice: 1095, marginPercent: 15, supplier: "Bauhaus" },
  { name: "Väggfärg 10L", description: "Pintura de pared lavable", unit: "UNIT", purchasePrice: 1250, marginPercent: 15, supplier: "Bauhaus" },
  { name: "Fasadfärg 10L", description: "Pintura de fachada exterior", unit: "UNIT", purchasePrice: 1650, marginPercent: 15, supplier: "Beckers" },
  { name: "Grundfärg 10L", description: "Imprimación", unit: "UNIT", purchasePrice: 895, marginPercent: 15, supplier: "Bauhaus" },
  { name: "Spackel 5kg", description: "Masilla para paredes", unit: "UNIT", purchasePrice: 245, marginPercent: 15, supplier: "Bauhaus" },
  { name: "Slippapper (paket)", description: "Papel de lija, paquete", unit: "PACKAGE", purchasePrice: 150, marginPercent: 15, supplier: "Bauhaus" },
  { name: "Parkett Ek 3-stav", description: "Parquet de roble 3 tablillas", unit: "M2", purchasePrice: 380, marginPercent: 20, supplier: "Golvpoolen" },
  { name: "Fiskbensparkett Ek", description: "Parquet espiga de roble", unit: "M2", purchasePrice: 550, marginPercent: 20, supplier: "Golvpoolen" },
  { name: "Parkettlim", description: "Pegamento para parquet", unit: "UNIT", purchasePrice: 450, marginPercent: 15, supplier: "Golvpoolen" },
  { name: "Parkettlack 5L", description: "Barniz para parquet", unit: "UNIT", purchasePrice: 1100, marginPercent: 15, supplier: "Golvpoolen" },
  { name: "Golvsockel MDF", description: "Rodapié MDF", unit: "METER", purchasePrice: 45, marginPercent: 20, supplier: "Beijer" },
  { name: "Laminatgolv", description: "Suelo laminado", unit: "M2", purchasePrice: 180, marginPercent: 20, supplier: "Golvpoolen" },
  { name: "Regel 45x120", description: "Listón estructural de madera", unit: "METER", purchasePrice: 35, marginPercent: 15, supplier: "Beijer" },
  { name: "Regel 45x70", description: "Listón estructural de madera", unit: "METER", purchasePrice: 22, marginPercent: 15, supplier: "Beijer" },
  { name: "Trallvirke tryckimpregnerat", description: "Tarima de madera tratada", unit: "M2", purchasePrice: 220, marginPercent: 20, supplier: "Beijer" },
  { name: "Komposittrall", description: "Tarima composite", unit: "M2", purchasePrice: 380, marginPercent: 20, supplier: "Beijer" },
  { name: "Kakel 20x20", description: "Azulejo de baño", unit: "M2", purchasePrice: 280, marginPercent: 20, supplier: "Kakelspecialisten" },
  { name: "Klinker 30x60", description: "Gres porcelánico para suelo", unit: "M2", purchasePrice: 350, marginPercent: 20, supplier: "Kakelspecialisten" },
  { name: "Fix och fog (säck)", description: "Cemento cola y junta", unit: "BAG", purchasePrice: 195, marginPercent: 15, supplier: "Beijer" },
  { name: "Tätskikt (våtrumssystem)", description: "Sistema de impermeabilización", unit: "M2", purchasePrice: 220, marginPercent: 15, supplier: "Mataki" },
  { name: "Gipsskiva 13mm", description: "Placa de pladur", unit: "UNIT", purchasePrice: 145, marginPercent: 15, supplier: "Beijer" },
  { name: "Isolering 95mm", description: "Aislamiento de lana mineral", unit: "M2", purchasePrice: 95, marginPercent: 15, supplier: "Beijer" },
  { name: "Skruv (låda)", description: "Caja de tornillos", unit: "BOX", purchasePrice: 180, marginPercent: 10, supplier: "Beijer" },
  { name: "Tapet (rulle)", description: "Rollo de papel pintado", unit: "ROLL", purchasePrice: 450, marginPercent: 20, supplier: "Bauhaus" },
];
