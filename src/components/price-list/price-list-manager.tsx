"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoney, pricingMethodLabel, unitLabel } from "@/lib/utils/format";
import { PRICING_METHODS, WORK_UNITS, type PriceListItemInput } from "@/lib/validation/price-list";

interface Category {
  id: string;
  name: string;
}

interface PriceItem extends PriceListItemInput {
  id: string;
  isSystem: boolean;
  category?: Category | null;
}

const EMPTY_FORM: PriceListItemInput = {
  name: "",
  categoryId: null,
  pricingMethod: "FIXED",
  unit: "UNIT",
  defaultUnitPrice: 0,
  defaultHourlyRate: null,
  description: "",
  nameSv: "",
};

export function PriceListManager({
  initialItems,
  categories,
}: {
  initialItems: PriceItem[];
  categories: Category[];
}) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [form, setForm] = useState<PriceListItemInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, PriceItem[]>();
    for (const item of filtered) {
      const key = item.category?.name ?? "Sin categoría";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(item: PriceItem) {
    setEditing(item);
    setForm({
      name: item.name,
      nameSv: item.nameSv ?? "",
      description: item.description ?? "",
      categoryId: item.category?.id ?? null,
      pricingMethod: item.pricingMethod,
      unit: item.unit,
      defaultUnitPrice: item.defaultUnitPrice,
      defaultHourlyRate: item.defaultHourlyRate ?? null,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editing ? `/api/price-list/${editing.id}` : "/api/price-list";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) return;

    const saved = await res.json();
    const category = categories.find((c) => c.id === saved.categoryId) ?? null;
    const savedItem = { ...saved, category };

    setItems((prev) =>
      editing ? prev.map((i) => (i.id === saved.id ? savedItem : i)) : [...prev, savedItem]
    );
    setModalOpen(false);
  }

  async function handleDelete(item: PriceItem) {
    if (!confirm(`¿Eliminar "${item.name}" de la lista de precios?`)) return;
    const res = await fetch(`/api/price-list/${item.id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar trabajo..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Agregar nuevo tipo de trabajo
        </Button>
      </div>

      {grouped.map(([categoryName, categoryItems]) => (
        <div key={categoryName} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">{categoryName}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Trabajo</th>
                  <th className="px-5 py-2.5 font-medium">Método</th>
                  <th className="px-5 py-2.5 font-medium">Precio</th>
                  <th className="px-5 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {categoryItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-slate-800">{item.name}</td>
                    <td className="px-5 py-2.5 text-slate-500">{pricingMethodLabel(item.pricingMethod)}</td>
                    <td className="px-5 py-2.5 font-medium text-slate-900">
                      {formatMoney(item.defaultUnitPrice)} / {unitLabel(item.unit)}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar trabajo" : "Nuevo tipo de trabajo"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre *">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Categoría">
            <Select
              value={form.categoryId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value || null }))}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Método de cálculo">
              <Select
                value={form.pricingMethod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricingMethod: e.target.value as PriceListItemInput["pricingMethod"] }))
                }
              >
                {PRICING_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {pricingMethodLabel(m)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Unidad">
              <Select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as PriceListItemInput["unit"] }))}
              >
                {WORK_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {unitLabel(u)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Precio por defecto (SEK)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.defaultUnitPrice}
              onChange={(e) => setForm((f) => ({ ...f, defaultUnitPrice: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
