// Ensambla, a partir de datos ya guardados en PostgreSQL (nunca del draft del
// cliente — sección 17 de la spec: el PDF nunca es la fuente de guardado),
// todo lo que necesita el documento PDF: trabajos agrupados por categoría,
// materiales (ligados a un trabajo o generales del proyecto) con su
// desperdicio/cantidad necesaria/cantidad a comprar, y el resumen económico.

import type { QuoteMaterial } from "@prisma/client";

import { calcItem, calcMaterial, calcQuote } from "@/lib/calc/engine";
import type { CalcQuoteResult } from "@/lib/calc/types";
import {
  aggregateRoomMeasurements,
  computeRoomMeasurements,
  getMeasurementValue,
} from "@/lib/calc/measurements";
import { computeMaterialAutoCalc } from "@/lib/calc/materials-auto";
import { toNumber } from "@/lib/utils/decimal";
import { toCalcInput, type QuoteWithRelations } from "@/lib/quotes/service";

export interface PdfJobLine {
  id: string;
  categoryName: string;
  name: string;
  roomNames: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  laborTotalHours: number | null;
  laborCostInternal: number;
  materialsCost: number;
}

export interface PdfJobCategoryGroup {
  categoryName: string;
  lines: PdfJobLine[];
  subtotal: number;
}

export interface PdfMaterialLine {
  id: string;
  categoryName: string;
  name: string;
  supplier: string | null;
  unit: string;
  baseQuantity: number | null;
  wastePercent: number;
  necessaryQuantity: number | null;
  quantity: number;
  purchasePrice: number;
  marginPercent: number;
  total: number;
  totalCost: number;
}

export interface PdfMaterialJobGroup {
  jobId: string;
  jobName: string;
  categoryName: string;
  lines: PdfMaterialLine[];
  subtotal: number;
}

export interface QuotePdfData {
  quoteNumber: string;
  quoteDate: string;
  projectName: string | null;
  siteAddress: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  jobGroups: PdfJobCategoryGroup[];
  materialJobGroups: PdfMaterialJobGroup[];
  generalMaterialLines: PdfMaterialLine[];
  result: CalcQuoteResult;
}

/** Cantidad base (m²/m) derivada de las habitaciones seleccionadas para un trabajo, igual que en el editor. */
function computeItemBaseQuantity(item: QuoteWithRelations["items"][number]): number {
  if (item.measurementSource === "NONE") return 0;
  const aggregated = aggregateRoomMeasurements(
    item.rooms.map((link) =>
      computeRoomMeasurements(
        {
          length: toNumber(link.room.length),
          width: toNumber(link.room.width),
          height: toNumber(link.room.height),
        },
        link.room.openings.map((o) => ({
          type: o.type,
          width: toNumber(o.width),
          height: toNumber(o.height),
          quantity: o.quantity,
        }))
      )
    )
  );
  return getMeasurementValue(item.measurementSource, aggregated, item.subtractOpeningWidths);
}

function buildMaterialLine(m: QuoteMaterial, baseQuantity: number | null): PdfMaterialLine {
  const calc = calcMaterial({
    id: m.id,
    quantity: toNumber(m.quantity),
    purchasePrice: toNumber(m.purchasePrice),
    marginPercent: toNumber(m.marginPercent),
  });

  let necessaryQuantity: number | null = null;
  if (m.calcType !== "NONE" && baseQuantity != null) {
    necessaryQuantity = computeMaterialAutoCalc(
      {
        calcType: m.calcType,
        coveragePerUnit: m.coveragePerUnit != null ? toNumber(m.coveragePerUnit) : null,
        coats: m.coats,
        wastePercent: toNumber(m.wastePercent),
        packageSize: m.packageSize != null ? toNumber(m.packageSize) : null,
        containerSizes: Array.isArray(m.containerSizes) ? (m.containerSizes as number[]) : null,
      },
      baseQuantity
    ).calculatedQuantity;
  }

  return {
    id: m.id,
    categoryName: m.categoryName || "",
    name: m.name || "Material",
    supplier: m.supplier,
    unit: m.unit,
    baseQuantity: m.calcType !== "NONE" ? baseQuantity : null,
    wastePercent: toNumber(m.wastePercent),
    necessaryQuantity,
    quantity: calc.quantity,
    purchasePrice: calc.purchasePrice,
    marginPercent: calc.marginPercent,
    total: calc.total,
    totalCost: calc.totalCost,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildQuotePdfData(quote: QuoteWithRelations): QuotePdfData {
  const calcInput = toCalcInput(quote);
  const result = calcQuote(calcInput);

  const jobLines: PdfJobLine[] = quote.items.map((item, index) => {
    const itemResult = calcItem(calcInput.items[index]);
    const roomNames = item.rooms.map((link) => link.room.name).join(", ");
    return {
      id: item.id,
      categoryName: item.categoryName || "",
      name: item.name,
      roomNames,
      quantity: itemResult.effectiveQuantity,
      unit: item.unit,
      unitPrice: itemResult.effectiveUnitPrice,
      lineTotal: itemResult.lineTotal,
      laborTotalHours: itemResult.laborTotalHours,
      laborCostInternal: itemResult.laborCostInternal,
      materialsCost: itemResult.materialsCost,
    };
  });

  const jobGroupOrder: string[] = [];
  const jobGroupsByCategory = new Map<string, PdfJobLine[]>();
  for (const line of jobLines) {
    const key = line.categoryName || "Otros trabajos";
    if (!jobGroupsByCategory.has(key)) {
      jobGroupsByCategory.set(key, []);
      jobGroupOrder.push(key);
    }
    jobGroupsByCategory.get(key)!.push(line);
  }
  const jobGroups: PdfJobCategoryGroup[] = jobGroupOrder.map((categoryName) => {
    const lines = jobGroupsByCategory.get(categoryName)!;
    return { categoryName, lines, subtotal: round2(lines.reduce((s, l) => s + l.lineTotal, 0)) };
  });

  const materialJobGroups: PdfMaterialJobGroup[] = quote.items
    .filter((item) => item.materials.length > 0)
    .map((item) => {
      const baseQuantity = computeItemBaseQuantity(item);
      const lines = item.materials.map((m) => buildMaterialLine(m, baseQuantity));
      return {
        jobId: item.id,
        jobName: item.name,
        categoryName: item.categoryName || "",
        lines,
        subtotal: round2(lines.reduce((s, l) => s + l.total, 0)),
      };
    });

  const generalMaterialLines: PdfMaterialLine[] = quote.generalMaterials.map((m) =>
    buildMaterialLine(m, m.baseQuantity != null ? toNumber(m.baseQuantity) : 0)
  );

  return {
    quoteNumber: quote.quoteNumber,
    quoteDate: quote.quoteDate.toISOString(),
    projectName: quote.projectName,
    siteAddress: quote.siteAddress,
    currency: quote.currency,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    jobGroups,
    materialJobGroups,
    generalMaterialLines,
    result,
  };
}
