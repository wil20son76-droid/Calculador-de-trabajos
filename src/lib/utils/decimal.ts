import type { Prisma } from "@prisma/client";

/** Convierte un Decimal de Prisma (o null) a number plano para el motor de cálculo. */
export function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}
