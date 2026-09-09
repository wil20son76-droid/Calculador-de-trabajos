// Sugerencias de materiales por trabajo (sección 11 de la spec). Nunca se
// añaden solos: la UI siempre pide confirmación ("Agregar todos" o selección
// individual) antes de crear cualquier línea de material.
//
// Los nombres se buscan como substring (sin distinguir mayúsculas) contra la
// biblioteca de materiales de la empresa, para no depender de que el nombre
// exacto en la biblioteca coincida carácter a carácter.
export const SUGGESTED_MATERIALS_BY_JOB: Record<string, string[]> = {
  "Pintura de paredes": ["Väggfärg", "Grundfärg", "Spackel"],
  "Pintura de techo": ["Takfärg", "Grundfärg"],
  "Pintura de puertas": ["Väggfärg", "Grundfärg"],
  "Pintura de ventanas": ["Väggfärg", "Grundfärg"],
  "Pintura de fachada": ["Fasadfärg", "Grundfärg"],
  "Empapelado": ["Tapet"],
  "Lijado de parquet": ["Slippapper"],
  "Barnizado": ["Parkettlack", "Grundfärg"],
  "Aceitado": ["Golvolja"],
  "Colocación de parquet": ["Parkett Ek 3-stav", "Parkettlim", "Underlag"],
  "Colocación de fiskbensparkett": [
    "Fiskbensparkett Ek",
    "Parkettlim",
    "Underlag",
    "Parkettlack",
    "Golvsockel MDF",
  ],
  "Colocación de laminado": ["Laminatgolv", "Underlag", "Fuktspärr"],
  "Instalación de rodapiés": ["Golvsockel MDF"],
  "Nivelación del suelo": ["Golvspackel"],
  Alicatado: ["Kakel", "Fix och fog"],
  "Colocación de suelo de baño": ["Klinker", "Tätskikt", "Fix och fog"],
  Pladur: ["Gipsskiva", "Regel", "Isolering", "Skruv"],
};

export interface SuggestedMaterialOption {
  id: string;
  name: string;
}

/** Materiales de la biblioteca que coinciden con las sugerencias de un trabajo, por nombre. */
export function getSuggestedMaterials<T extends { id: string; name: string }>(
  jobName: string,
  library: T[]
): T[] {
  const suggestions = SUGGESTED_MATERIALS_BY_JOB[jobName];
  if (!suggestions || suggestions.length === 0) return [];

  const matches: T[] = [];
  for (const suggestion of suggestions) {
    const found = library.find((m) => m.name.toLowerCase().includes(suggestion.toLowerCase()));
    if (found) matches.push(found);
  }
  return matches;
}
