import type { CalcQuoteResult } from "@/lib/calc/types";

export interface FortnoxItemLine {
  name: string;
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
  rotEnabled: boolean;
}

function formatKr(value: number, currency: string): string {
  const rounded = Math.round(value);
  const formatted = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(rounded);
  return `${formatted} ${currency === "SEK" ? "kr" : currency}`;
}

/**
 * Genera el texto de detalle para copiar a Fortnox (sueco, profesional) y una
 * versión en español para revisión interna antes de copiarlo. Nunca incluye
 * coste interno, precio de compra, beneficio ni margen — solo los importes que
 * vería un cliente (sección "Detalle interno vs Fortnox").
 */
export function generateFortnoxText(input: FortnoxTextInput): { swedish: string; spanish: string } {
  const { items, result, currency, rotEnabled } = input;

  const bulletsSv = items.map((item) => {
    const qty = item.showQuantity ? `, ca ${formatQty(item.quantity)} ${item.unit}` : "";
    return `• ${item.name}${qty}`;
  });

  const swedishLines = [
    "Arbeten som ingår:",
    "",
    ...bulletsSv,
    "",
    `Arbetskostnad: ${formatKr(result.laborAfterDiscount, currency)}`,
    `Material: ${formatKr(result.materialAfterDiscount, currency)}`,
    `Övriga kostnader: ${formatKr(result.otherAfterDiscount, currency)}`,
    `Moms: ${formatKr(result.vatAmount, currency)}`,
    "",
  ];

  if (rotEnabled && result.rotDeduction > 0) {
    swedishLines.push(
      `ROT-underlag: ${formatKr(result.rotEligibleLaborBase, currency)}`,
      `Beräknat ROT-avdrag: -${formatKr(result.rotDeduction, currency)}`,
      "",
      `Totalt före ROT: ${formatKr(result.totalInclVat, currency)}`,
      `Att betala efter beräknat ROT-avdrag: ${formatKr(result.totalDue, currency)}`
    );
  } else {
    swedishLines.push(`Totalt: ${formatKr(result.totalInclVat, currency)}`);
  }

  const bulletsEs = items.map((item) => {
    const qty = item.showQuantity ? `, aprox. ${formatQty(item.quantity)} ${item.unit}` : "";
    return `• ${item.name}${qty}`;
  });

  const spanishLines = [
    "Trabajos incluidos:",
    "",
    ...bulletsEs,
    "",
    `Coste de trabajo: ${formatKr(result.laborAfterDiscount, currency)}`,
    `Material: ${formatKr(result.materialAfterDiscount, currency)}`,
    `Otros costes: ${formatKr(result.otherAfterDiscount, currency)}`,
    `Moms/IVA: ${formatKr(result.vatAmount, currency)}`,
    "",
  ];

  if (rotEnabled && result.rotDeduction > 0) {
    spanishLines.push(
      `Base ROT (mano de obra elegible): ${formatKr(result.rotEligibleLaborBase, currency)}`,
      `ROT-avdrag estimado: -${formatKr(result.rotDeduction, currency)}`,
      "",
      `Total antes de ROT: ${formatKr(result.totalInclVat, currency)}`,
      `Total después de ROT: ${formatKr(result.totalDue, currency)}`
    );
  } else {
    spanishLines.push(`Total: ${formatKr(result.totalInclVat, currency)}`);
  }

  return { swedish: swedishLines.join("\n"), spanish: spanishLines.join("\n") };
}

function formatQty(value: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(value);
}
