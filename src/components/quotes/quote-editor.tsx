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
import {
  Plus,
  Copy,
  Trash2,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileDown,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { calcQuote } from "@/lib/calc/engine";
import { draftToCalcInput } from "@/lib/calc/from-draft";
import { groupLinesByCategory } from "@/lib/calc/category-summary";
import { generateFortnoxText } from "@/lib/quotes/fortnox-text";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { type QuoteUpdateInput, DISCOUNT_TYPES } from "@/lib/validation/quote";
import type { ItemDraft, QuoteDraft } from "@/lib/quotes/draft-types";
import { emptyOtherCost } from "@/lib/quotes/draft-types";
import { QuoteItemRow } from "./quote-item-row";
import { QuoteSummary } from "./quote-summary";
import { RoomManager } from "./room-manager";
import { FortnoxCopyPanel } from "./fortnox-copy-panel";
import { JobPickerModal, type PriceListOption } from "./job-picker-modal";
import { MaterialPickerModal, type MaterialOption } from "./material-picker-modal";
import { QuoteMaterialRow } from "./quote-material-row";
import { TemplatePickerModal, type TemplateOption } from "./template-picker-modal";

// Estado de guardado mostrado permanentemente en la cabecera (sección 18 de la
// spec). "dirty" = hay cambios locales que todavía no se confirmaron en
// PostgreSQL — nunca se debe mostrar "Guardado" mientras el estado sea este ni
// mientras sea "saving", ni si la petición de guardado falló ("error").
type SaveState = "clean" | "dirty" | "saving" | "saved" | "error";

const AREA_METHODS = new Set(["PER_M2", "PER_METER"]);

function draftStorageKey(quoteId: string) {
  return `quote-draft:${quoteId}`;
}

function buildSavePayload(data: QuoteDraft): QuoteUpdateInput {
  return {
    projectName: data.projectName,
    siteAddress: data.siteAddress,
    quoteDate: new Date(data.quoteDate),
    currency: data.currency,
    vatRatePercent: data.vatRatePercent,
    rotPercent: data.rotPercent,
    rutPercent: data.rutPercent,
    discountType: data.discountType,
    discountValue: data.discountValue,
    materialMarginDefaultPercent: data.materialMarginDefaultPercent,
    notesInternal: data.notesInternal,
    rooms: data.rooms,
    items: data.items,
    otherCosts: data.otherCosts,
    generalMaterials: data.generalMaterials,
  };
}

export function QuoteEditor({
  quoteId,
  quoteNumber,
  createdAt,
  updatedAt,
  initialDraft,
  priceListItems,
  materialLibrary,
  templates,
}: {
  quoteId: string;
  quoteNumber: string;
  createdAt: string;
  updatedAt: string;
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
  const [generalMaterialModalOpen, setGeneralMaterialModalOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("clean");
  const [recoveryDraft, setRecoveryDraft] = useState<QuoteDraft | null>(null);
  const [pdfMode, setPdfMode] = useState<"internal" | "fortnox">("internal");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(updatedAt);
  const isFirstRender = useRef(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Siempre refleja el draft más reciente, incluso dentro de callbacks/cleanup
  // que capturaron una versión anterior por closure (p.ej. al desmontar). Se
  // actualiza en un efecto (nunca durante el render) — para cuando el
  // desmontaje ocurre, el efecto del render anterior ya se ha confirmado.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  // true mientras haya cambios que todavía no se confirmaron en PostgreSQL.
  const dirtyRef = useRef(false);

  const result = calcQuote(draftToCalcInput(draft));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const save = useCallback(
    async (data: QuoteDraft) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/quotes/${quoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildSavePayload(data)),
        });
        if (!res.ok) throw new Error(`PATCH /api/quotes/${quoteId} -> ${res.status}`);
        dirtyRef.current = false;
        setSaveState("saved");
        setLastSavedAt(new Date().toISOString());
        // Ya está a salvo en PostgreSQL: el borrador local de emergencia deja de hacer falta.
        try {
          localStorage.removeItem(draftStorageKey(quoteId));
        } catch {
          // localStorage no disponible (modo privado, cuota...): no es crítico aquí.
        }
      } catch {
        // Nunca marcar como guardado si la petición falló — el draft sigue "dirty"
        // y el borrador local de emergencia se mantiene para no perder el cambio.
        setSaveState("error");
      }
    },
    [quoteId]
  );

  // Guarda inmediatamente, cancelando cualquier debounce pendiente. Lo usan el
  // botón manual "Guardar cambios" y el flush al desmontar/salir.
  const flushSave = useCallback(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    return save(draftRef.current);
  }, [save]);

  // Recuperación de borrador local: si al abrir este cálculo existe en
  // localStorage una versión distinta a la que acabamos de cargar de
  // PostgreSQL, es que la última sesión no llegó a guardar (se cerró la
  // pestaña, se perdió la conexión, etc.) — se ofrece recuperarla en vez de
  // perderla silenciosamente.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftStorageKey(quoteId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as QuoteDraft;
      if (JSON.stringify(parsed) !== JSON.stringify(initialDraft)) {
        // Lectura de localStorage (sistema externo) solo al montar: no hay forma
        // de derivar este estado durante el render, así que se fija aquí.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecoveryDraft(parsed);
      } else {
        localStorage.removeItem(draftStorageKey(quoteId));
      }
    } catch {
      // Borrador corrupto o localStorage no disponible: se ignora sin romper la carga del cálculo.
    }
    // Solo al montar: initialDraft es la foto de PostgreSQL en el momento de cargar la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  function recoverDraft() {
    if (!recoveryDraft) return;
    setDraft(recoveryDraft);
    setRecoveryDraft(null);
  }

  function discardDraft() {
    try {
      localStorage.removeItem(draftStorageKey(quoteId));
    } catch {
      // no-op
    }
    setRecoveryDraft(null);
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dirtyRef.current = true;
    setSaveState("dirty");

    // Protección inmediata (sección 3): el borrador se guarda en localStorage
    // en cuanto cambia, no solo cuando se confirma el debounce, para que un
    // cierre de pestaña o una pérdida de conexión justo después de escribir
    // nunca deje el cambio sin ningún rastro recuperable.
    try {
      localStorage.setItem(draftStorageKey(quoteId), JSON.stringify(draft));
    } catch {
      // localStorage lleno o no disponible: seguimos con el autoguardado normal.
    }

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(draft), 1200);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, quoteId]);

  // Flush al desmontar (p.ej. al navegar a otra página dentro de la app): sin
  // esto, cancelar el timeout pendiente en el cleanup perdía en silencio
  // cualquier cambio hecho en el último segundo antes de salir — la causa
  // raíz del cálculo que "se borró". El fetch sigue en curso aunque el
  // componente ya se haya desmontado, porque la navegación de Next.js no
  // descarga la página (el contexto de JS sigue vivo).
  useEffect(() => {
    return () => {
      if (dirtyRef.current) {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        void save(draftRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Último recurso ante cierre de pestaña/recarga/navegación fuera de la app:
  // fetch con keepalive (sobrevive a la descarga de la página, a diferencia de
  // un fetch normal) más el aviso nativo del navegador si hay cambios sin guardar.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      try {
        fetch(`/api/quotes/${quoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildSavePayload(draftRef.current)),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // no-op: sigue mostrándose la confirmación nativa aunque el fetch falle al construirse.
      }
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [quoteId]);

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

  // Materiales generales del proyecto (sección 10): no están atados a ningún
  // trabajo, así que viven directamente en el draft en vez de en item.materials.
  function addGeneralMaterial(material: ItemDraft["materials"][number]) {
    setDraft((prev) => ({ ...prev, generalMaterials: [...prev.generalMaterials, material] }));
  }

  function updateGeneralMaterial(id: string, patch: Partial<ItemDraft["materials"][number]>) {
    setDraft((prev) => ({
      ...prev,
      generalMaterials: prev.generalMaterials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  function removeGeneralMaterial(id: string) {
    setDraft((prev) => ({
      ...prev,
      generalMaterials: prev.generalMaterials.filter((m) => m.id !== id),
    }));
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

  // El PDF nunca es la fuente de guardado (sección 17): si hay cambios sin
  // confirmar en PostgreSQL, se guardan primero y solo se abre el PDF si el
  // guardado tuvo éxito. Si el guardado falla, se avisa en vez de generar un
  // PDF con datos desactualizados.
  async function handleExportPdf() {
    setPdfLoading(true);
    try {
      if (dirtyRef.current) {
        await flushSave();
        if (dirtyRef.current) {
          alert(
            "No se pudieron guardar los cambios. Corrige el error de guardado antes de exportar el PDF."
          );
          return;
        }
      }
      window.open(`/api/quotes/${quoteId}/pdf?mode=${pdfMode}`, "_blank");
    } finally {
      setPdfLoading(false);
    }
  }

  const categoryGroups = groupLinesByCategory(
    draft.items.map((item, i) => ({
      id: item.id,
      name: item.name || "Trabajo",
      categoryName: item.categoryName || "",
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      lineTotal: result.items[i]?.lineTotal ?? 0,
    }))
  );

  // Resumen de materiales agrupado por categoría (sección 14): junta los
  // materiales ligados a trabajos (heredan la categoría del trabajo) y los
  // materiales generales del proyecto (con su propia categoría, u "Otros").
  const materialCategoryGroups = groupLinesByCategory([
    ...draft.items.flatMap((item, i) =>
      item.materials.map((m, mi) => ({
        id: m.id,
        name: m.name || "Material",
        categoryName: m.categoryName || item.categoryName || "",
        quantity: m.quantity,
        unit: m.unit,
        unitPrice: m.purchasePrice,
        lineTotal: result.items[i]?.materials[mi]?.total ?? 0,
      }))
    ),
    ...draft.generalMaterials.map((m, mi) => ({
      id: m.id,
      name: m.name || "Material",
      categoryName: m.categoryName || "",
      quantity: m.quantity,
      unit: m.unit,
      unitPrice: m.purchasePrice,
      lineTotal: result.generalMaterials[mi]?.total ?? 0,
    })),
  ]);

  const totalHours = draft.items.reduce(
    (sum, item) =>
      sum + (item.useDetailedLabor ? (item.workerCount || 0) * (item.hoursPerWorker || 0) : 0),
    0
  );
  const effectiveHourlyRate = totalHours > 0 ? result.laborAfterDiscount / totalHours : 0;

  const fortnoxText = generateFortnoxText({
    projectName: draft.projectName,
    currency: draft.currency,
    result,
    items: draft.items.map((item) => ({
      name: item.name || "Trabajo",
      categoryName: item.categoryName || "",
      quantity: item.quantity,
      unit: item.unit.toLowerCase(),
      showQuantity: AREA_METHODS.has(item.pricingMethod) || item.pricingMethod === "PER_UNIT",
    })),
  });

  return (
    <div className="space-y-6">
      {recoveryDraft && (
        <Card className="border-amber-300 bg-amber-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-900">
              Se encontró un cálculo sin guardar de una sesión anterior. ¿Deseas recuperarlo?
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={recoverDraft}>
                Recuperar
              </Button>
              <Button size="sm" variant="outline" onClick={discardDraft}>
                Descartar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {draft.projectName || "Cálculo sin nombre"}
          </h1>
          <p className="text-xs text-slate-400">
            Ref. {quoteNumber} · Creado: {formatDate(createdAt)} · Última modificación:{" "}
            {formatDateTime(lastSavedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveStatusBadge state={saveState} />
          <Button onClick={flushSave} disabled={saveState === "saving"}>
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
          <Select
            value={pdfMode}
            onChange={(e) => setPdfMode(e.target.value as "internal" | "fortnox")}
            className="w-auto py-2 text-sm"
            title="Tipo de PDF"
          >
            <option value="internal">Detallado interno</option>
            <option value="fortnox">Para Fortnox</option>
          </Select>
          <Button variant="outline" onClick={handleExportPdf} disabled={pdfLoading}>
            <FileDown className="h-4 w-4" /> {pdfLoading ? "Generando..." : "Exportar PDF"}
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

          {/* Materiales generales del proyecto (sección 8-10): materiales que no
              se quieren relacionar con un trabajo concreto. */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Materiales generales del proyecto
                </h2>
                <p className="text-xs text-slate-400">
                  Para materiales que no quieres relacionar con un trabajo concreto.
                </p>
              </div>
              <Button size="sm" onClick={() => setGeneralMaterialModalOpen(true)}>
                <Plus className="h-4 w-4" /> Agregar material
              </Button>
            </div>

            {draft.generalMaterials.length > 0 ? (
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
                    {draft.generalMaterials.map((m) => (
                      <QuoteMaterialRow
                        key={m.id}
                        material={m}
                        currency={draft.currency}
                        baseQuantity={0}
                        editableBaseQuantity
                        onChange={(patch) => updateGeneralMaterial(m.id, patch)}
                        onRemove={() => removeGeneralMaterial(m.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin materiales generales todavía.</p>
            )}
          </Card>

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

          {/* Moms, ROT/RUT y descuento */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Moms, ROT/RUT y descuento</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            </div>
            <p className="mt-3 text-xs text-slate-400">
              ROT {draft.rotPercent}% y RUT {draft.rutPercent}% (configurables en Configuración) se
              aplican solo sobre los trabajos marcados como &ldquo;ROT&rdquo; o &ldquo;RUT&rdquo;
              respectivamente en su Skattereduktion (ver cada línea de trabajo). Materiales y otros
              costes nunca entran en ninguna base de deducción.
            </p>
          </Card>

          <FortnoxCopyPanel swedish={fortnoxText.swedish} spanish={fortnoxText.spanish} />
        </div>

        {/* Resumen */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <QuoteSummary
            result={result}
            categoryGroups={categoryGroups}
            materialCategoryGroups={materialCategoryGroups}
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
      <MaterialPickerModal
        open={generalMaterialModalOpen}
        onClose={() => setGeneralMaterialModalOpen(false)}
        options={materialLibrary}
        defaultMargin={draft.materialMarginDefaultPercent}
        onSelect={addGeneralMaterial}
      />
    </div>
  );
}

/**
 * Estado de guardado siempre visible (sección 18 de la spec): nunca debe
 * mostrar "Guardado" mientras haya cambios sin confirmar en PostgreSQL o
 * mientras la petición esté en curso o haya fallado.
 */
function SaveStatusBadge({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" /> No se pudo guardar
      </span>
    );
  }
  if (state === "dirty") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
        ● Cambios sin guardar
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
    </span>
  );
}
