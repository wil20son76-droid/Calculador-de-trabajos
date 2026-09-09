/** Formatea un importe monetario con el formato sueco: "12 500 SEK". */
export function formatMoney(value: number, currency = "SEK"): string {
  const rounded = Math.round(value);
  const formatted = new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: 0,
  }).format(rounded);
  return `${formatted} ${currency}`;
}

/** Formatea un número con separador de miles sueco, sin moneda. */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Fecha y hora, para "Última modificación" (sección 19 de la spec). */
export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const UNIT_LABELS: Record<string, string> = {
  UNIT: "st",
  HOUR: "h",
  M2: "m²",
  M3: "m³",
  METER: "m",
  DAY: "dag",
  KG: "kg",
  TON: "ton",
  LITER: "L",
  BAG: "säck",
  PACKAGE: "paket",
  BOX: "låda",
  ROLL: "rulle",
};

export function unitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit.toLowerCase();
}

const PRICING_METHOD_LABELS: Record<string, string> = {
  FIXED: "Precio fijo",
  HOURLY: "Por hora",
  PER_M2: "Por m²",
  PER_METER: "Por metro lineal",
  PER_UNIT: "Por unidad",
  PER_DAY: "Por día",
};

export function pricingMethodLabel(method: string): string {
  return PRICING_METHOD_LABELS[method] ?? method;
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  IN_PROGRESS: "En ejecución",
  COMPLETED: "Finalizado",
  INVOICED: "Facturado",
};

export function quoteStatusLabel(status: string): string {
  return QUOTE_STATUS_LABELS[status] ?? status;
}

const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-teal-100 text-teal-700",
  INVOICED: "bg-purple-100 text-purple-700",
};

export function quoteStatusColor(status: string): string {
  return QUOTE_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700";
}
