import { round2 } from "./round";

// Agrupa las líneas de trabajo por categoría para el resumen (sección
// "Resumen agrupado por categoría") y para el texto de Fortnox, que también
// agrupa sus viñetas por categoría. Es una función pura y genérica: recibe
// una vista mínima de cada línea (nombre, categoría, cantidad/unidad para
// mostrar y el importe ya calculado por el motor) en vez de acoplarse a
// CalcItemResult o a los drafts de la UI.
export interface CategorySummaryLine {
  id: string;
  name: string;
  categoryName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface CategorySummaryGroup {
  categoryName: string;
  lines: CategorySummaryLine[];
  subtotal: number;
}

const UNCATEGORIZED = "Otros trabajos";

/** Agrupa manteniendo el orden de primera aparición de cada categoría. */
export function groupLinesByCategory(lines: CategorySummaryLine[]): CategorySummaryGroup[] {
  const order: string[] = [];
  const byCategory = new Map<string, CategorySummaryLine[]>();

  for (const line of lines) {
    const key = line.categoryName || UNCATEGORIZED;
    if (!byCategory.has(key)) {
      byCategory.set(key, []);
      order.push(key);
    }
    byCategory.get(key)!.push(line);
  }

  return order.map((categoryName) => {
    const groupLines = byCategory.get(categoryName)!;
    const subtotal = round2(groupLines.reduce((sum, l) => sum + l.lineTotal, 0));
    return { categoryName, lines: groupLines, subtotal };
  });
}
