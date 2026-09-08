"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Plus, Copy, Trash2, Layers } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { calcQuote } from "@/lib/calc/engine";
import { draftToCalcInput } from "@/lib/calc/from-draft";
import { generateFortnoxText } from "@/lib/quotes/fortnox-text";
import { type QuoteUpdateInput, DISCOUNT_TYPES } from "@/lib/validation/quote";
import type { ItemDraft, QuoteDraft } from "@/lib/quotes/draft-types";
import { emptyOtherCost } from "@/lib/quotes/draft-types";
import { QuoteItemRow } from "./quote-item-row";
import { QuoteSummary } from "./quote-summary";
import { RoomManager } from "./room-manager";
import { FortnoxCopyPanel } from "./fortnox-copy-panel";
import { JobPickerModal, type PriceListOption } from "./job-picker-modal";
import type { MaterialOption } from "./material-picker-modal";
import { TemplatePickerModal, type TemplateOption } from "./template-picker-modal";

type SaveState = "idle" | "saving" | "saved" | "error";

const AREA_METHODS = new Set(["PER_M2", "PER_METER"]);

export function QuoteEditor({
  quoteId,
  quoteNumber,
  initialDraft,
  priceListItems,
  materialLibrary,
  templates,
}: {
  quoteId: string;
  quoteNumber: string;
  initialDraft: QuoteDraft;
  priceListItems: PriceListOption[];
  categories: { id: string; name: string }[];
  materialLibrary: MaterialOption[];
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const isFirstRender = useRef(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const result = calcQuote(draftToCalcInput(draft));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const save = useCallback(
    async (data: QuoteDraft) => {
      setSaveState("saving");
      const payload: QuoteUpdateInput = {
        projectName: data.projectName,
        siteAddress: data.siteAddress,
        quoteDate: new Date(data.quoteDate),
        currency: data.currency,
        vatRatePercent: data.vatRatePercent,
        rotEnabled: data.rotEnabled,
        rotPercent: data.rotPercent,
        discountType: data.discountType,
        discountValue: data.discountValue,
        materialMarginDefaultPercent: data.materialMarginDefaultPercent,
        notesInternal: data.notesInternal,
        rooms: data.rooms,
        items: data.items,
        otherCosts: data.otherCosts,
      };

      try {
        const res = await fetch(`/api/quotes/${quoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    },
    [quoteId]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(draft), 1000);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function update<K extends keyof QuoteDraft>(key: K, value: QuoteDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(updated: ItemDraft) {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === updated.id ? updated : i)),
    }));
  }

  function addItem(item: ItemDraft) {
    setDraft((prev) => ({ ...prev, items: [...prev.items, item] }));
  }

  function addItemsFromTemplate(items: ItemDraft[]) {
    setDraft((prev) => ({ ...prev, items: [...prev.items, ...items] }));
  }

  function removeItem(id: string) {
    if (!confirm("¿Eliminar este trabajo?")) return;
    setDraft((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
  }

  function duplicateItem(id: string) {
    setDraft((prev) => {
      const item = prev.items.find((i) => i.id === id);
      if (!item) return prev;
      const copy: ItemDraft = {
        ...item,
        id: `tmp-copy-${Date.now()}`,
        materials: item.materials.map((m) => ({ ...m, id: `tmp-copy-mat-${Date.now()}-${m.id}` })),
      };
      const index = prev.items.findIndex((i) => i.id === id);
      const items = [...prev.items];
      items.splice(index + 1, 0, copy);
      return { ...prev, items };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((prev) => {
      const oldIndex = prev.items.findIndex((i) => i.id === active.id);
      const newIndex = prev.items.findIndex((i) => i.id === over.id);
      return { ...prev, items: arrayMove(prev.items, oldIndex, newIndex) };
    });
  }

  function addOtherCost() {
    setDraft((prev) => ({ ...prev, otherCosts: [...prev.otherCosts, emptyOtherCost()] }));
  }

  function updateOtherCost(id: string, patch: Partial<QuoteDraft["otherCosts"][number]>) {
    setDraft((prev) => ({
      ...prev,
      otherCosts: prev.otherCosts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function removeOtherCost(id: string) {
    setDraft((prev) => ({ ...prev, otherCosts: prev.otherCosts.filter((c) => c.id !== id) }));
  }

  async function handleDuplicateQuote() {
    const res = await fetch(`/api/quotes/${quoteId}/duplicate`, { method: "POST" });
    if (res.ok) {
      const copy = await res.json();
      router.push(`/presupuestos/${copy.id}`);
    }
  }

  async function handleDeleteQuote() {
    if (!confirm("¿Eliminar este cálculo? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    if (res.ok) router.push("/presupuestos");
  }

  const totalHours = draft.items.reduce(
    (sum, item) =>
      sum + (item.useDetailedLabor ? (item.workerCount || 0) * (item.hoursPerWorker || 0) : 0),
    0
  );
  const effectiveHourlyRate = totalHours > 0 ? result.laborAfterDiscount / totalHours : 0;

  const fortnoxText = generateFortnoxText({
    projectName: draft.projectName,
    currency: draft.currency,
    rotEnabled: draft.rotEnabled,
    result,
    items: draft.items.map((item) => ({
      name: item.name || "Trabajo",
      quantity: item.quantity,
      unit: item.unit.toLowerCase(),
      showQuantity: AREA_METHODS.has(item.pricingMethod) || item.pricingMethod === "PER_UNIT",
    })),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {draft.projectName || "Cálculo sin nombre"}
          </h1>
          <p className="text-xs text-slate-400">
            Ref. {quoteNumber} ·{" "}
            {saveState === "saving" && "Guardando..."}
            {saveState === "saved" && "Guardado"}
            {saveState === "error" && "Error al guardar"}
            {saveState === "idle" && "Autoguardado activado"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleDuplicateQuote}>
            <Copy className="h-4 w-4" /> Duplicar
          </Button>
          <Button variant="danger" onClick={handleDeleteQuote}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Datos del trabajo */}
          <Card>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nombre del trabajo/proyecto" className="sm:col-span-2">
                <Input
                  value={draft.projectName}
                  onChange={(e) => update("projectName", e.target.value)}
                  placeholder="Ej. Pintura apartamento 75 m²"
                  className="text-base font-medium"
                />
              </Field>
              <Field label="Dirección / referencia (opcional)">
                <Input
                  value={draft.siteAddress}
                  onChange={(e) => update("siteAddress", e.target.value)}
                  placeholder="Ej. Sveavägen 45, Estocolmo"
                />
              </Field>
              <Field label="Fecha">
                <Input
                  type="date"
                  value={draft.quoteDate}
                  onChange={(e) => update("quoteDate", e.target.value)}
                />
              </Field>
              <Field label="Notas internas (opcional)" className="sm:col-span-2">
                <Input
                  value={draft.notesInternal}
                  onChange={(e) => update("notesInternal", e.target.value)}
                  placeholder="Notas para ti, nunca se copian a Fortnox"
                />
              </Field>
            </div>
          </Card>

          {/* Calculador de habitaciones */}
          <RoomManager rooms={draft.rooms} onChange={(rooms) => update("rooms", rooms)} />

          {/* Trabajos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Trabajos</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setTemplateModalOpen(true)}>
                  <Layers className="h-4 w-4" /> Usar plantilla
                </Button>
                <Button size="sm" onClick={() => setJobModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Agregar trabajo
                </Button>
              </div>
            </div>

            {draft.items.length === 0 && (
              <Card className="border-dashed text-center text-sm text-slate-400">
                Todavía no hay trabajos. Añade el primero con &ldquo;Agregar trabajo&rdquo;.
              </Card>
            )}

            <DndContext
              id="quote-items-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={draft.items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {draft.items.map((item, index) => (
                    <QuoteItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      currency={draft.currency}
                      materialLibrary={materialLibrary}
                      defaultMargin={draft.materialMarginDefaultPercent}
                      rooms={draft.rooms}
                      onChange={updateItem}
                      onRemove={() => removeItem(item.id)}
                      onDuplicate={() => duplicateItem(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Otros costes */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Otros costes</h2>
              <Button size="sm" variant="outline" onClick={addOtherCost}>
                <Plus className="h-4 w-4" /> Agregar coste
              </Button>
            </div>
            <div className="space-y-2">
              {draft.otherCosts.map((cost) => (
                <div key={cost.id} className="flex items-center gap-2">
                  <Input
                    value={cost.name}
                    onChange={(e) => updateOtherCost(cost.id, { name: e.target.value })}
                    placeholder="Transporte, parking, trängselskatt, residuos..."
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={cost.quantity}
                    onChange={(e) => updateOtherCost(cost.id, { quantity: Number(e.target.value) })}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={cost.unitPrice}
                    onChange={(e) => updateOtherCost(cost.id, { unitPrice: Number(e.target.value) })}
                    className="w-28"
                  />
                  <button
                    onClick={() => removeOtherCost(cost.id)}
                    className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {draft.otherCosts.length === 0 && (
                <p className="text-sm text-slate-400">Sin otros costes.</p>
              )}
            </div>
          </Card>

          {/* Moms, ROT y descuento */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Moms, ROT y descuento</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Moms / IVA %">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={draft.vatRatePercent}
                  onChange={(e) => update("vatRatePercent", Number(e.target.value))}
                />
              </Field>
              <Field label="Descuento">
                <Select
                  value={draft.discountType}
                  onChange={(e) => update("discountType", e.target.value as QuoteDraft["discountType"])}
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
                  value={draft.discountValue}
                  disabled={draft.discountType === "NONE"}
                  onChange={(e) => update("discountValue", Number(e.target.value))}
                />
              </Field>
              <Field label="ROT-avdrag">
                <label className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.rotEnabled}
                    onChange={(e) => update("rotEnabled", e.target.checked)}
                  />
                  {draft.rotEnabled ? "Activado" : "Desactivado"} ({draft.rotPercent}%)
                </label>
              </Field>
            </div>
            {draft.rotEnabled && (
              <p className="mt-2 text-xs text-slate-400">
                Se aplica solo sobre los trabajos marcados como &ldquo;ROT-berättigad&rdquo; (ver
                cada línea de trabajo). Materiales y otros costes nunca entran en la base del ROT.
              </p>
            )}
          </Card>

          <FortnoxCopyPanel swedish={fortnoxText.swedish} spanish={fortnoxText.spanish} />
        </div>

        {/* Resumen */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <QuoteSummary
            result={result}
            rotEnabled={draft.rotEnabled}
            currency={draft.currency}
            totalHours={totalHours}
            effectiveHourlyRate={effectiveHourlyRate}
            showInternal
          />
        </div>
      </div>

      <JobPickerModal
        open={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        options={priceListItems}
        onSelect={addItem}
      />
      <TemplatePickerModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        templates={templates}
        onSelect={addItemsFromTemplate}
      />
    </div>
  );
}
