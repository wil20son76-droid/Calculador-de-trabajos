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
import { Plus, Download, Copy, Trash2, Eye, EyeOff, Layers } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { calcQuote } from "@/lib/calc/engine";
import { draftToCalcInput } from "@/lib/calc/from-draft";
import { QUOTE_STATUSES, type QuoteUpdateInput } from "@/lib/validation/quote";
import { DISCOUNT_TYPES } from "@/lib/validation/quote";
import { quoteStatusLabel } from "@/lib/utils/format";
import type { ItemDraft, QuoteDraft } from "@/lib/quotes/draft-types";
import { emptyOtherCost } from "@/lib/quotes/draft-types";
import { QuoteItemRow } from "./quote-item-row";
import { QuoteSummary } from "./quote-summary";
import { JobPickerModal, type PriceListOption } from "./job-picker-modal";
import type { MaterialOption } from "./material-picker-modal";
import { TemplatePickerModal, type TemplateOption } from "./template-picker-modal";

interface Customer {
  id: string;
  firstName: string;
  lastName: string | null;
  companyName: string | null;
  address: string | null;
  city: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function QuoteEditor({
  quoteId,
  quoteNumber,
  initialDraft,
  customers,
  priceListItems,
  materialLibrary,
  templates,
}: {
  quoteId: string;
  quoteNumber: string;
  initialDraft: QuoteDraft;
  customers: Customer[];
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
  const [showVisibility, setShowVisibility] = useState(false);
  const isFirstRender = useRef(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const result = calcQuote(draftToCalcInput(draft));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const save = useCallback(
    async (data: QuoteDraft) => {
      setSaveState("saving");
      const payload: QuoteUpdateInput = {
        status: data.status as QuoteUpdateInput["status"],
        customerId: data.customerId,
        projectName: data.projectName,
        projectDescription: data.projectDescription,
        siteAddressDifferent: data.siteAddressDifferent,
        siteAddress: data.siteAddress,
        sitePostalCode: data.sitePostalCode,
        siteCity: data.siteCity,
        quoteDate: new Date(data.quoteDate),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        currency: data.currency,
        vatRatePercent: data.vatRatePercent,
        rotEnabled: data.rotEnabled,
        rotPercent: data.rotPercent,
        discountType: data.discountType,
        discountValue: data.discountValue,
        materialMarginDefaultPercent: data.materialMarginDefaultPercent,
        showHours: data.showHours,
        showHourlyRate: data.showHourlyRate,
        showMaterialsIndividually: data.showMaterialsIndividually,
        showMaterialPrices: data.showMaterialPrices,
        showUnitPrice: data.showUnitPrice,
        showOnlyTotalPerJob: data.showOnlyTotalPerJob,
        showMaterialsOnPdf: data.showMaterialsOnPdf,
        includedText: data.includedText,
        excludedText: data.excludedText,
        termsText: data.termsText,
        notesInternal: data.notesInternal,
        notesClient: data.notesClient,
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
    if (!confirm("¿Eliminar esta línea de trabajo?")) return;
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
    if (!confirm("¿Eliminar este presupuesto? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    if (res.ok) router.push("/presupuestos");
  }

  const selectedCustomer = customers.find((c) => c.id === draft.customerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{quoteNumber}</h1>
          <p className="text-xs text-slate-400">
            {saveState === "saving" && "Guardando..."}
            {saveState === "saved" && "Guardado"}
            {saveState === "error" && "Error al guardar"}
            {saveState === "idle" && "Autoguardado activado"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={draft.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-auto"
          >
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {quoteStatusLabel(s)}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            onClick={() => window.open(`/api/quotes/${quoteId}/pdf`, "_blank")}
          >
            <Download className="h-4 w-4" /> PDF
          </Button>
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
          {/* Datos del cliente */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Cliente</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Cliente">
                <Select value={draft.customerId} onChange={(e) => update("customerId", e.target.value)}>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName ?? ""} {c.companyName ? `(${c.companyName})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-col justify-center text-sm text-slate-500">
                {selectedCustomer?.address && <p>{selectedCustomer.address}</p>}
                {selectedCustomer?.city && <p>{selectedCustomer.city}</p>}
              </div>
            </div>
          </Card>

          {/* Datos del proyecto */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Datos del proyecto</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nombre del proyecto" className="sm:col-span-2">
                <Input
                  value={draft.projectName}
                  onChange={(e) => update("projectName", e.target.value)}
                  placeholder="Ej. Pintura apartamento 75 m²"
                />
              </Field>
              <Field label="Descripción" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={draft.projectDescription}
                  onChange={(e) => update("projectDescription", e.target.value)}
                />
              </Field>
              <Field label="Fecha del presupuesto">
                <Input
                  type="date"
                  value={draft.quoteDate}
                  onChange={(e) => update("quoteDate", e.target.value)}
                />
              </Field>
              <Field label="Válido hasta">
                <Input
                  type="date"
                  value={draft.validUntil}
                  onChange={(e) => update("validUntil", e.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.siteAddressDifferent}
                  onChange={(e) => update("siteAddressDifferent", e.target.checked)}
                />
                Dirección de la obra diferente a la del cliente
              </label>
              {draft.siteAddressDifferent && (
                <>
                  <Field label="Dirección de la obra">
                    <Input
                      value={draft.siteAddress}
                      onChange={(e) => update("siteAddress", e.target.value)}
                    />
                  </Field>
                  <Field label="Código postal / Ciudad">
                    <div className="flex gap-2">
                      <Input
                        value={draft.sitePostalCode}
                        onChange={(e) => update("sitePostalCode", e.target.value)}
                        placeholder="CP"
                      />
                      <Input
                        value={draft.siteCity}
                        onChange={(e) => update("siteCity", e.target.value)}
                        placeholder="Ciudad"
                      />
                    </div>
                  </Field>
                </>
              )}
            </div>
          </Card>

          {/* Trabajos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Trabajos</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setTemplateModalOpen(true)}>
                  <Layers className="h-4 w-4" /> Usar plantilla
                </Button>
                <Button size="sm" onClick={() => setJobModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Lägg till arbete
                </Button>
              </div>
            </div>

            {draft.items.length === 0 && (
              <Card className="border-dashed text-center text-sm text-slate-400">
                Todavía no hay trabajos. Añade el primero con “Lägg till arbete”.
              </Card>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                    placeholder="Transporte, parking, contenedor..."
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

          {/* ROT, moms, descuento global */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Impuestos, ROT y descuento</h2>
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
              <Field label="ROT">
                <label className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.rotEnabled}
                    onChange={(e) => update("rotEnabled", e.target.checked)}
                  />
                  {draft.rotEnabled ? "Sí" : "No"} ({draft.rotPercent}%)
                </label>
              </Field>
            </div>
          </Card>

          {/* Incluido / no incluido / condiciones */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Incluido, no incluido y condiciones</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Incluido en el precio">
                <Textarea
                  rows={3}
                  value={draft.includedText}
                  onChange={(e) => update("includedText", e.target.value)}
                />
              </Field>
              <Field label="No incluido en el precio">
                <Textarea
                  rows={3}
                  value={draft.excludedText}
                  onChange={(e) => update("excludedText", e.target.value)}
                />
              </Field>
              <Field label="Condiciones de la oferta" className="sm:col-span-2">
                <Textarea
                  rows={4}
                  value={draft.termsText}
                  onChange={(e) => update("termsText", e.target.value)}
                />
              </Field>
              <Field label="Notas para el cliente (visible en PDF)">
                <Textarea
                  rows={2}
                  value={draft.notesClient}
                  onChange={(e) => update("notesClient", e.target.value)}
                />
              </Field>
              <Field label="Notas internas (nunca visible)">
                <Textarea
                  rows={2}
                  value={draft.notesInternal}
                  onChange={(e) => update("notesInternal", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Visibilidad PDF */}
          <Card>
            <button
              onClick={() => setShowVisibility((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
            >
              <span className="flex items-center gap-2">
                {showVisibility ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Opciones de visibilidad del PDF
              </span>
              <span className="text-xs font-normal text-slate-400">
                {showVisibility ? "Ocultar" : "Mostrar"}
              </span>
            </button>
            {showVisibility && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ["showHours", "Mostrar horas"],
                  ["showHourlyRate", "Mostrar precio por hora"],
                  ["showMaterialsIndividually", "Mostrar materiales individualmente"],
                  ["showMaterialPrices", "Mostrar precio de materiales"],
                  ["showUnitPrice", "Mostrar precio unitario"],
                  ["showOnlyTotalPerJob", "Mostrar solo precio total por trabajo"],
                  ["showMaterialsOnPdf", "Incluir sección de materiales en el PDF"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(draft[key as keyof QuoteDraft])}
                      onChange={(e) => update(key as keyof QuoteDraft, e.target.checked as never)}
                    />
                    {label}
                  </label>
                ))}
                <p className="col-span-full text-xs text-slate-400">
                  El margen y el beneficio interno nunca se muestran en el PDF del cliente.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Resumen */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <QuoteSummary
            result={result}
            rotEnabled={draft.rotEnabled}
            currency={draft.currency}
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
