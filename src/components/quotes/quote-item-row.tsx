"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Ruler,
  RefreshCw,
} from "lucide-react";

import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { calcItem } from "@/lib/calc/engine";
import { formatMoney, formatNumber, pricingMethodLabel, unitLabel } from "@/lib/utils/format";
import { PRICING_METHODS, WORK_UNITS } from "@/lib/validation/price-list";
import { DISCOUNT_TYPES, MEASUREMENT_SOURCES } from "@/lib/validation/quote";
import type { ItemDraft, MaterialDraft, RoomDraft } from "@/lib/quotes/draft-types";
import {
  aggregateRoomMeasurements,
  computeRoomMeasurements,
  getMeasurementValue,
  type MeasurementSource,
} from "@/lib/calc/measurements";
import type { MaterialOption } from "./material-picker-modal";
import { MaterialPickerModal } from "./material-picker-modal";
import { QuoteMaterialRow } from "./quote-material-row";
import { getSuggestedMaterials } from "@/lib/quotes/suggested-materials";
import { emptyMaterial } from "@/lib/quotes/draft-types";

const MEASUREMENT_LABELS: Record<MeasurementSource, string> = {
  NONE: "Manual (sin medición)",
  NET_WALL: "Paredes netas (bruto − puertas/ventanas)",
  GROSS_WALL: "Paredes brutas",
  CEILING: "Techo",
  FLOOR: "Suelo",
  PERIMETER: "Perímetro",
};

export function QuoteItemRow({
  item,
  index,
  currency,
  materialLibrary,
  defaultMargin,
  rooms,
  onChange,
  onRemove,
  onDuplicate,
}: {
  item: ItemDraft;
  index: number;
  currency: string;
  materialLibrary: MaterialOption[];
  defaultMargin: number;
  rooms: RoomDraft[];
  onChange: (item: ItemDraft) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const calc = calcItem({
    id: item.id,
    useDetailedLabor: item.useDetailedLabor,
    workerCount: item.workerCount,
    hoursPerWorker: item.hoursPerWorker,
    hourlyRate: item.hourlyRate,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountType: item.discountType,
    discountValue: item.discountValue,
    companyCost: item.companyCost,
    deductionType: item.deductionType,
    materials: item.materials.map((m) => ({
      id: m.id,
      quantity: m.quantity,
      purchasePrice: m.purchasePrice,
      marginPercent: m.marginPercent,
    })),
  });

  const selectedRooms = rooms.filter((r) => item.roomIds.includes(r.id));
  const aggregated = aggregateRoomMeasurements(
    selectedRooms.map((r) => computeRoomMeasurements(r, r.openings))
  );
  const measuredValue =
    item.measurementSource !== "NONE"
      ? getMeasurementValue(item.measurementSource, aggregated, item.subtractOpeningWidths)
      : 0;
  const measurementDiffers =
    item.measurementSource !== "NONE" && Math.abs(measuredValue - item.quantity) > 0.01;

  function update<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) {
    onChange({ ...item, [key]: value });
  }

  function toggleRoom(roomId: string) {
    const next = item.roomIds.includes(roomId)
      ? item.roomIds.filter((id) => id !== roomId)
      : [...item.roomIds, roomId];
    update("roomIds", next);
  }

  const allRoomsSelected = rooms.length > 0 && rooms.every((r) => item.roomIds.includes(r.id));

  function toggleAllRooms() {
    update("roomIds", allRoomsSelected ? [] : rooms.map((r) => r.id));
  }

  function updateMaterial(materialId: string, patch: Partial<MaterialDraft>) {
    update(
      "materials",
      item.materials.map((m) => (m.id === materialId ? { ...m, ...patch } : m))
    );
  }

  function removeMaterial(materialId: string) {
    update(
      "materials",
      item.materials.filter((m) => m.id !== materialId)
    );
  }

  function addMaterial(material: MaterialDraft) {
    update("materials", [...item.materials, material]);
  }

  // Materiales recomendados (sección 11): nunca se agregan solos, siempre
  // requieren confirmación explícita ("Agregar todos" o uno a uno).
  const suggestedMaterials = getSuggestedMaterials(item.name, materialLibrary).filter(
    (option) => !item.materials.some((m) => m.materialLibraryItemId === option.id)
  );

  function addSuggestedMaterial(option: MaterialOption) {
    addMaterial({
      ...emptyMaterial(),
      materialLibraryItemId: option.id,
      name: option.name,
      unit: option.unit,
      purchasePrice: option.purchasePrice,
      marginPercent: option.marginPercent || defaultMargin,
      calcType: option.calcType,
      coveragePerUnit: option.coveragePerUnit,
      coats: option.coatsDefault,
      wastePercent: option.wastePercentDefault,
      packageSize: option.packageSize,
      containerSizes: option.containerSizes,
    });
  }

  function addAllSuggestedMaterials() {
    suggestedMaterials.forEach(addSuggestedMaterial);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-2 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
              {index + 1}
            </span>
            <Input
              value={item.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nombre del trabajo"
              className="min-w-[180px] flex-1 font-medium"
            />
            <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
              {formatMoney(calc.lineTotal, currency)}
            </span>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={onDuplicate}
              title="Duplicar línea"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={onRemove}
              title="Eliminar"
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select
              value={item.pricingMethod}
              onChange={(e) => update("pricingMethod", e.target.value as ItemDraft["pricingMethod"])}
            >
              {PRICING_METHODS.map((m) => (
                <option key={m} value={m}>
                  {pricingMethodLabel(m)}
                </option>
              ))}
            </Select>
            <Select value={item.unit} onChange={(e) => update("unit", e.target.value as ItemDraft["unit"])}>
              {WORK_UNITS.map((u) => (
                <option key={u} value={u}>
                  {unitLabel(u)}
                </option>
              ))}
            </Select>
            {!item.useDetailedLabor ? (
              <>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => update("quantity", Number(e.target.value))}
                  placeholder="Cantidad"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => update("unitPrice", Number(e.target.value))}
                  placeholder="Precio"
                />
              </>
            ) : (
              <div className="col-span-2 flex items-center text-xs text-slate-400">
                Horas: {calc.laborTotalHours ?? 0}h × {formatMoney(item.hourlyRate ?? 0, currency)}
              </div>
            )}
          </div>

          {/* Calculador de habitaciones: reutilizar medición (sección 2, 3, 4) */}
          {rooms.length > 0 && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Ruler className="h-3.5 w-3.5 text-slate-400" />
                <Select
                  value={item.measurementSource}
                  onChange={(e) =>
                    update("measurementSource", e.target.value as ItemDraft["measurementSource"])
                  }
                  className="w-auto py-1 text-xs"
                >
                  {MEASUREMENT_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {MEASUREMENT_LABELS[s]}
                    </option>
                  ))}
                </Select>
                {item.measurementSource === "PERIMETER" && (
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={item.subtractOpeningWidths}
                      onChange={(e) => update("subtractOpeningWidths", e.target.checked)}
                    />
                    Restar ancho de puertas (rodapiés)
                  </label>
                )}
              </div>

              {item.measurementSource !== "NONE" && (
                <>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={toggleAllRooms}
                      className={
                        "rounded-full border px-2.5 py-1 text-xs font-medium " +
                        (allRoomsSelected
                          ? "border-blue-300 bg-blue-100 text-blue-700"
                          : "border-dashed border-slate-300 bg-white text-slate-500 hover:bg-slate-100")
                      }
                    >
                      Todo el proyecto
                    </button>
                    {rooms.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRoom(r.id)}
                        className={
                          "rounded-full border px-2.5 py-1 text-xs " +
                          (item.roomIds.includes(r.id)
                            ? "border-blue-300 bg-blue-100 text-blue-700"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
                        }
                      >
                        {r.name || "Sin nombre"}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span>
                      Medida actual:{" "}
                      <b className="text-slate-900">
                        {formatNumber(measuredValue, 2)} {item.measurementSource === "PERIMETER" ? "m" : "m²"}
                      </b>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => update("quantity", measuredValue)}
                    >
                      <RefreshCw className="h-3 w-3" /> Usar esta medida
                    </Button>
                    {measurementDiffers && (
                      <span className="text-amber-600">
                        (la cantidad guardada, {formatNumber(item.quantity, 2)}, no coincide)
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={item.useDetailedLabor}
                onChange={(e) => update("useDetailedLabor", e.target.checked)}
              />
              Calcular por horas de mano de obra (trabajadores × horas × precio/h)
            </label>
            <label
              className="flex items-center gap-2 text-xs font-medium text-slate-600"
              title="Skattereduktion: si la mano de obra de este trabajo es elegible para ROT, RUT o ninguna"
            >
              Skattereduktion
              <Select
                value={item.deductionType}
                onChange={(e) => update("deductionType", e.target.value as ItemDraft["deductionType"])}
                className="w-auto py-1 text-xs"
              >
                <option value="ROT">ROT</option>
                <option value="RUT">RUT</option>
                <option value="NONE">Ingen</option>
              </Select>
            </label>
          </div>

          {item.useDetailedLabor && (
            <div className="grid grid-cols-4 gap-2 rounded-lg bg-slate-50 p-3">
              <Field label="Trabajadores">
                <Input
                  type="number"
                  min={0}
                  value={item.workerCount ?? 0}
                  onChange={(e) => update("workerCount", Number(e.target.value))}
                />
              </Field>
              <Field label="Horas / trabajador">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={item.hoursPerWorker ?? 0}
                  onChange={(e) => update("hoursPerWorker", Number(e.target.value))}
                />
              </Field>
              <Field label="Precio / hora (cliente)">
                <Input
                  type="number"
                  min={0}
                  value={item.hourlyRate ?? 0}
                  onChange={(e) => update("hourlyRate", Number(e.target.value))}
                />
              </Field>
              <Field label="Coste interno / hora">
                <Input
                  type="number"
                  min={0}
                  value={item.internalHourlyRate ?? 0}
                  onChange={(e) => update("internalHourlyRate", Number(e.target.value))}
                />
              </Field>
            </div>
          )}

          {expanded && (
            <div className="space-y-4 border-t border-slate-100 pt-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Descripción (detalle para Fortnox)">
                  <Textarea
                    rows={2}
                    value={item.descriptionClient ?? ""}
                    onChange={(e) => update("descriptionClient", e.target.value)}
                  />
                </Field>
                <Field label="Notas internas (nunca se copian a Fortnox)">
                  <Textarea
                    rows={2}
                    value={item.descriptionInternal ?? ""}
                    onChange={(e) => update("descriptionInternal", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Field label="Coste interno adicional (empresa)">
                  <Input
                    type="number"
                    min={0}
                    value={item.companyCost ?? 0}
                    onChange={(e) => update("companyCost", Number(e.target.value))}
                  />
                </Field>
                <Field label="Descuento línea">
                  <Select
                    value={item.discountType}
                    onChange={(e) => update("discountType", e.target.value as ItemDraft["discountType"])}
                  >
                    {DISCOUNT_TYPES.map((d) => (
                      <option key={d} value={d}>
                        {d === "NONE" ? "Sin descuento" : d === "PERCENT" ? "%" : "SEK fijo"}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Valor descuento">
                  <Input
                    type="number"
                    min={0}
                    value={item.discountValue}
                    onChange={(e) => update("discountValue", Number(e.target.value))}
                    disabled={item.discountType === "NONE"}
                  />
                </Field>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Materiales
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMaterialModalOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Lägg till material
                  </Button>
                </div>

                {suggestedMaterials.length > 0 && (
                  <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/60 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-blue-800">
                        Materiales recomendados para &ldquo;{item.name}&rdquo;
                      </span>
                      <Button type="button" size="sm" variant="outline" onClick={addAllSuggestedMaterials}>
                        Agregar todos
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedMaterials.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => addSuggestedMaterial(option)}
                          className="flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100"
                        >
                          <Plus className="h-3 w-3" /> {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {item.materials.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase text-slate-400">
                          <th className="px-3 py-2 font-medium">Material</th>
                          <th className="px-3 py-2 font-medium">Cant.</th>
                          <th className="px-3 py-2 font-medium">Unidad</th>
                          <th className="px-3 py-2 font-medium">Compra</th>
                          <th className="px-3 py-2 font-medium">Margen %</th>
                          <th className="px-3 py-2 font-medium">Total</th>
                          <th></th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.materials.map((m) => (
                          <QuoteMaterialRow
                            key={m.id}
                            material={m}
                            currency={currency}
                            baseQuantity={item.quantity}
                            onChange={(patch) => updateMaterial(m.id, patch)}
                            onRemove={() => removeMaterial(m.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <MaterialPickerModal
        open={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
        options={materialLibrary}
        defaultMargin={defaultMargin}
        onSelect={addMaterial}
      />
    </div>
  );
}
