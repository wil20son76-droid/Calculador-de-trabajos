import type { CalcQuoteResult } from "@/lib/calc/types";

export interface FortnoxItemLine {
  name: string;
  /** Categoría del trabajo, para agrupar las viñetas (p.ej. "Pintura interior", "Suelos"). */
  categoryName: string;
  quantity: number;
  unit: string;
  /** true si la cantidad es una medida (m², m, unidades...) que merece la pena mostrar. */
  showQuantity: boolean;
}

export interface FortnoxTextInput {
  projectName: string;
  items: FortnoxItemLine[];
  result: CalcQuoteResult;
  currency: string;
}

const UNCATEGORIZED = "Övrigt";

function groupByCategory(items: FortnoxItemLine[]): Map<string, FortnoxItemLine[]> {
  const groups = new Map<string, FortnoxItemLine[]>();
  for (const item of items) {
    const key = item.categoryName || UNCATEGORIZED;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

function formatKr(value: number, currency: string): string {
  const rounded = Math.round(value);
  const formatted = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(rounded);
  return `${formatted} ${currency === "SEK" ? "kr" : currency}`;
}

/**
 * Genera el texto de detalle para copiar a Fortnox (sueco, profesional) y una
 * versión en español para revisión interna antes de copiarlo. Las viñetas se
 * agrupan por categoría de trabajo, y las bases/deducciones de ROT y RUT se
 * muestran siempre por separado. Nunca incluye coste interno, precio de
 * compra, beneficio ni margen — solo los importes que vería un cliente.
 */
export function generateFortnoxText(input: FortnoxTextInput): { swedish: string; spanish: string } {
  const { items, result, currency } = input;
  const grouped = groupByCategory(items);

  const bulletsFor = (formatQtyLabel: (item: FortnoxItemLine) => string) => {
    const lines: string[] = [];
    for (const [categoryName, categoryItems] of grouped) {
      lines.push(`${categoryName}:`);
      for (const item of categoryItems) {
        const qty = item.showQuantity ? `, ${formatQtyLabel(item)}` : "";
        lines.push(`• ${item.name}${qty}`);
      }
      lines.push("");
    }
    if (lines.length > 0) lines.pop(); // sin línea vacía sobrante al final
    return lines;
  };

  const swedishLines = [
    "Arbeten som ingår:",
    "",
    ...bulletsFor((item) => `ca ${formatQty(item.quantity)} ${item.unit}`),
    "",
    `Arbetskostnad: ${formatKr(result.laborAfterDiscount, currency)}`,
    `Material: ${formatKr(result.materialAfterDiscount, currency)}`,
    `Övriga kostnader: ${formatKr(result.otherAfterDiscount, currency)}`,
    `Moms: ${formatKr(result.vatAmount, currency)}`,
    "",
  ];

  if (result.rotDeduction > 0) {
    swedishLines.push(
      `ROT-underlag: ${formatKr(result.rotEligibleLaborBase, currency)}`,
      `Beräknat ROT-avdrag: -${formatKr(result.rotDeduction, currency)}`,
      ""
    );
  }
  if (result.rutDeduction > 0) {
    swedishLines.push(
      `RUT-underlag: ${formatKr(result.rutEligibleLaborBase, currency)}`,
      `Beräknat RUT-avdrag: -${formatKr(result.rutDeduction, currency)}`,
      ""
    );
  }

  if (result.rotDeduction > 0 || result.rutDeduction > 0) {
    swedishLines.push(
      `Totalt före avdrag: ${formatKr(result.totalInclVat, currency)}`,
      `Att betala efter beräknat avdrag: ${formatKr(result.totalDue, currency)}`
    );
  } else {
    swedishLines.push(`Totalt: ${formatKr(result.totalInclVat, currency)}`);
  }

  const spanishLines = [
    "Trabajos incluidos:",
    "",
    ...bulletsFor((item) => `aprox. ${formatQty(item.quantity)} ${item.unit}`),
    "",
    `Coste de trabajo: ${formatKr(result.laborAfterDiscount, currency)}`,
    `Material: ${formatKr(result.materialAfterDiscount, currency)}`,
    `Otros costes: ${formatKr(result.otherAfterDiscount, currency)}`,
    `Moms/IVA: ${formatKr(result.vatAmount, currency)}`,
    "",
  ];

  if (result.rotDeduction > 0) {
    spanishLines.push(
      `Base ROT (mano de obra elegible): ${formatKr(result.rotEligibleLaborBase, currency)}`,
      `ROT-avdrag estimado: -${formatKr(result.rotDeduction, currency)}`,
      ""
    );
  }
  if (result.rutDeduction > 0) {
    spanishLines.push(
      `Base RUT (mano de obra elegible): ${formatKr(result.rutEligibleLaborBase, currency)}`,
      `RUT-avdrag estimado: -${formatKr(result.rutDeduction, currency)}`,
      ""
    );
  }

  if (result.rotDeduction > 0 || result.rutDeduction > 0) {
    spanishLines.push(
      `Total antes de deducciones: ${formatKr(result.totalInclVat, currency)}`,
      `Total después de deducciones: ${formatKr(result.totalDue, currency)}`
    );
  } else {
    spanishLines.push(`Total: ${formatKr(result.totalInclVat, currency)}`);
  }

  return { swedish: swedishLines.join("\n"), spanish: spanishLines.join("\n") };
}

function formatQty(value: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(value);
}
