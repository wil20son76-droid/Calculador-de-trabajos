"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoney, unitLabel } from "@/lib/utils/format";
import { MATERIAL_UNITS, type MaterialLibraryItemInput } from "@/lib/validation/material";

interface MaterialItem extends MaterialLibraryItemInput {
  id: string;
}

const EMPTY_FORM: MaterialLibraryItemInput = {
  name: "",
  description: "",
  unit: "UNIT",
  purchasePrice: 0,
  marginPercent: 15,
  supplier: "",
  sku: "",
};

export function MaterialManager({ initialItems }: { initialItems: MaterialItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialItem | null>(null);
  const [form, setForm] = useState<MaterialLibraryItemInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.supplier?.toLowerCase().includes(q)
    );
  }, [items, search]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(item: MaterialItem) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      unit: item.unit,
      purchasePrice: item.purchasePrice,
      marginPercent: item.marginPercent,
      supplier: item.supplier ?? "",
      sku: item.sku ?? "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editing ? `/api/materials/${editing.id}` : "/api/materials";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) return;

    const saved = await res.json();
    setItems((prev) => (editing ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved]));
    setModalOpen(false);
  }

  async function handleDelete(item: MaterialItem) {
    if (!confirm(`¿Eliminar "${item.name}" de la biblioteca de materiales?`)) return;
    const res = await fetch(`/api/materials/${item.id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  const sellPrice = (item: MaterialLibraryItemInput) =>
    item.purchasePrice * (1 + item.marginPercent / 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar material o proveedor..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Agregar material
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Material</th>
                <th className="px-5 py-3 font-medium">Proveedor</th>
                <th className="px-5 py-3 font-medium">Compra</th>
                <th className="px-5 py-3 font-medium">Margen</th>
                <th className="px-5 py-3 font-medium">Venta</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-800">
                    {item.name}
                    <span className="ml-1 text-xs text-slate-400">/{unitLabel(item.unit)}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{item.supplier ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{formatMoney(item.purchasePrice)}</td>
                  <td className="px-5 py-3 text-slate-600">{item.marginPercent}%</td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {formatMoney(sellPrice(item))}
                  </td>
                  <td className="px-5 py-3">
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar material" : "Nuevo material"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre *">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unidad">
              <Select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as MaterialLibraryItemInput["unit"] }))}
              >
                {MATERIAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {unitLabel(u)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Proveedor">
              <Input
                value={form.supplier ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio de compra (SEK)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => setForm((f) => ({ ...f, purchasePrice: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Margen (%)">
              <Input
                type="number"
                min={0}
                step="0.1"
                value={form.marginPercent}
                onChange={(e) => setForm((f) => ({ ...f, marginPercent: Number(e.target.value) }))}
              />
            </Field>
          </div>
          <p className="text-xs text-slate-400">
            Precio de venta: {formatMoney(sellPrice(form))}
          </p>
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
