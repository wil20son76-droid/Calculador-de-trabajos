"use client";

import { useState } from "react";
import { Trash2, Calculator, RefreshCw, AlertTriangle } from "lucide-react";

import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber, unitLabel } from "@/lib/utils/format";
import { MATERIAL_UNITS } from "@/lib/validation/material";
import { MATERIAL_CALC_TYPES } from "@/lib/validation/quote";
import { computeMaterialAutoCalc } from "@/lib/calc/materials-auto";
import type { MaterialDraft } from "@/lib/quotes/draft-types";

const CALC_TYPE_LABELS: Record<MaterialDraft["calcType"], string> = {
  NONE: "Manual",
  PAINT: "Pintura/barniz (rendimiento + manos)",
  COVERAGE: "Consumo por m² (pegamento, imprimación...)",
  PACKAGE: "Paquetes por superficie (parquet, laminado...)",
};

export function QuoteMaterialRow({
  material,
  currency,
  baseQuantity,
  editableBaseQuantity = false,
  onChange,
  onRemove,
}: {
  material: MaterialDraft;
  currency: string;
  /** Cantidad base (m² o m) de la línea de trabajo, usada por el cálculo automático. */
  baseQuantity: number;
  /**
   * Si es true (materiales generales del proyecto, sin trabajo/habitación de
   * origen), la cantidad base se introduce a mano en `material.baseQuantity`
   * en vez de derivarse de una medición — sección 12 de la spec.
   */
  editableBaseQuantity?: boolean;
  onChange: (patch: Partial<MaterialDraft>) => void;
  onRemove: () => void;
}) {
  const [calcOpen, setCalcOpen] = useState(false);

  const effectiveBaseQuantity = editableBaseQuantity ? material.baseQuantity ?? 0 : baseQuantity;

  const auto =
    material.calcType !== "NONE"
      ? computeMaterialAutoCalc(
          {
            calcType: material.calcType,
            coveragePerUnit: material.coveragePerUnit,
            coats: material.coats,
            wastePercent: material.wastePercent,
            packageSize: material.packageSize,
            containerSizes: material.containerSizes,
          },
          effectiveBaseQuantity
        )
      : null;

  // Si la última cantidad calculada guardada difiere de la que da la medición
  // actual, la habitación ha cambiado desde el último cálculo (sección 13).
  const hasDrift =
    auto != null &&
    material.calculatedQuantity != null &&
    Math.abs(material.calculatedQuantity - auto.calculatedQuantity) > 0.01;

  function applyAutoQuantity() {
    if (!auto) return;
    onChange({ quantity: auto.suggestedQuantity, calculatedQuantity: auto.calculatedQuantity });
  }

  const total = material.purchasePrice * (1 + material.marginPercent / 100) * material.quantity;

  return (
    <>
      <tr className="border-b border-slate-50 last:border-0">
        <td className="px-3 py-1.5">
          <Input
            value={material.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="min-w-[120px] py-1"
          />
        </td>
        <td className="px-3 py-1.5">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={material.quantity}
            onChange={(e) => onChange({ quantity: Number(e.target.value) })}
            className="w-20 py-1"
          />
        </td>
        <td className="px-3 py-1.5">
          <Select
            value={material.unit}
            onChange={(e) => onChange({ unit: e.target.value as MaterialDraft["unit"] })}
            className="py-1"
          >
            {MATERIAL_UNITS.map((u) => (
              <option key={u} value={u}>
                {unitLabel(u)}
              </option>
            ))}
          </Select>
        </td>
        <td className="px-3 py-1.5">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={material.purchasePrice}
            onChange={(e) => onChange({ purchasePrice: Number(e.target.value) })}
            className="w-24 py-1"
          />
        </td>
        <td className="px-3 py-1.5">
          <Input
            type="number"
            min={0}
            step="0.1"
            value={material.marginPercent}
            onChange={(e) => onChange({ marginPercent: Number(e.target.value) })}
            className="w-20 py-1"
          />
        </td>
        <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-700">
          {formatMoney(total, currency)}
        </td>
        <td className="px-1">
          <button
            onClick={() => setCalcOpen((v) => !v)}
            title="Cálculo automático"
            className={
              "rounded p-1 " +
              (material.calcType !== "NONE"
                ? "text-blue-500 hover:bg-blue-50"
                : "text-slate-300 hover:bg-slate-100")
            }
          >
            <Calculator className="h-3.5 w-3.5" />
          </button>
        </td>
        <td className="px-2">
          <button
            onClick={onRemove}
            className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
      {calcOpen && (
        <tr className="border-b border-slate-50 bg-slate-50/60 last:border-0">
          <td colSpan={8} className="px-3 py-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <label className="col-span-2 flex flex-col gap-1 text-[11px] text-slate-500 sm:col-span-2">
                Tipo de cálculo
                <Select
                  value={material.calcType}
                  onChange={(e) =>
                    onChange({ calcType: e.target.value as MaterialDraft["calcType"] })
                  }
                  className="py-1 text-xs"
                >
                  {MATERIAL_CALC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {CALC_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </label>

              {(material.calcType === "PAINT" || material.calcType === "COVERAGE") && (
                <>
                  <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                    {material.calcType === "PAINT" ? "Rendimiento (m²/L)" : "Consumo (kg o L/m²)"}
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={material.coveragePerUnit ?? 0}
                      onChange={(e) => onChange({ coveragePerUnit: Number(e.target.value) })}
                      className="py-1 text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                    Manos
                    <Input
                      type="number"
                      min={1}
                      value={material.coats ?? 1}
                      onChange={(e) => onChange({ coats: Number(e.target.value) })}
                      className="py-1 text-xs"
                    />
                  </label>
                </>
              )}

              {editableBaseQuantity && material.calcType !== "NONE" && (
                <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                  Cantidad base
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={material.baseQuantity ?? 0}
                    onChange={(e) => onChange({ baseQuantity: Number(e.target.value) })}
                    className="py-1 text-xs"
                  />
                </label>
              )}

              {material.calcType === "PACKAGE" && (
                <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                  m² por paquete
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={material.packageSize ?? 0}
                    onChange={(e) => onChange({ packageSize: Number(e.target.value) })}
                    className="py-1 text-xs"
                  />
                </label>
              )}

              <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                Desperdicio %
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={material.wastePercent}
                  onChange={(e) => onChange({ wastePercent: Number(e.target.value) })}
                  className="py-1 text-xs"
                />
              </label>

              {(material.calcType === "PAINT" || material.calcType === "COVERAGE") && (
                <label className="col-span-2 flex flex-col gap-1 text-[11px] text-slate-500 sm:col-span-2">
                  Envases disponibles (separados por coma, ej. 1, 2.7, 5, 9, 10)
                  <Input
                    value={(material.containerSizes ?? []).join(", ")}
                    onChange={(e) =>
                      onChange({
                        containerSizes: e.target.value
                          .split(",")
                          .map((v) => Number(v.trim()))
                          .filter((v) => !Number.isNaN(v) && v > 0),
                      })
                    }
                    className="py-1 text-xs"
                    placeholder="Sin envases: se compra la cantidad exacta"
                  />
                </label>
              )}
            </div>

            {auto && material.calcType !== "NONE" && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-slate-600">
                <span>
                  Cantidad calculada:{" "}
                  <b className="text-slate-900">
                    {formatNumber(auto.calculatedQuantity, 2)} {unitLabel(material.unit)}
                  </b>
                </span>
                {auto.containerSuggestion && auto.containerSuggestion.combination.length > 0 && (
                  <span>
                    Comprar:{" "}
                    <b className="text-slate-900">
                      {auto.containerSuggestion.combination
                        .map((c) => `${c.count} × ${formatNumber(c.size, 2)}`)
                        .join(" + ")}{" "}
                      = {formatNumber(auto.suggestedQuantity, 2)} {unitLabel(material.unit)}
                    </b>
                    {auto.containerSuggestion.leftover > 0 && (
                      <> (sobran {formatNumber(auto.containerSuggestion.leftover, 2)})</>
                    )}
                  </span>
                )}
                {auto.packageResult && auto.packageResult.packagesNeeded > 0 && (
                  <span>
                    Paquetes:{" "}
                    <b className="text-slate-900">{auto.packageResult.packagesNeeded}</b> ={" "}
                    {formatNumber(auto.packageResult.purchasedArea, 2)} m²
                    {auto.packageResult.leftoverArea > 0 && (
                      <> (sobran {formatNumber(auto.packageResult.leftoverArea, 2)} m²)</>
                    )}
                  </span>
                )}
                <Button type="button" size="sm" variant="outline" onClick={applyAutoQuantity}>
                  <RefreshCw className="h-3 w-3" /> Usar esta cantidad
                </Button>
                {hasDrift && (
                  <span className="flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    La medición cambió desde el último cálculo — revisa la cantidad.
                  </span>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
