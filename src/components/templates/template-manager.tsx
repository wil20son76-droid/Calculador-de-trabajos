"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoney, pricingMethodLabel, unitLabel } from "@/lib/utils/format";
import { PRICING_METHODS, WORK_UNITS } from "@/lib/validation/price-list";
import type { TemplateInput, TemplateItemInput } from "@/lib/validation/template";

interface Template extends TemplateInput {
  id: string;
}

function emptyTemplateItem(): TemplateItemInput {
  return { name: "", pricingMethod: "FIXED", unit: "UNIT", quantity: 1, unitPrice: 0 };
}

export function TemplateManager({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState<TemplateInput>({ name: "", description: "", items: [] });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", items: [emptyTemplateItem()] });
    setModalOpen(true);
  }

  function openEdit(template: Template) {
    setEditing(template);
    setForm({ name: template.name, description: template.description, items: template.items });
    setModalOpen(true);
  }

  function updateItem(index: number, patch: Partial<TemplateItemInput>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function removeItem(index: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/templates/${editing.id}` : "/api/templates";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return;
    const saved = await res.json();
    setTemplates((prev) =>
      editing ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]
    );
    setModalOpen(false);
  }

  async function handleDelete(template: Template) {
    if (!confirm(`¿Eliminar la plantilla "${template.name}"?`)) return;
    const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== template.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nueva plantilla
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id}>
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">{t.name}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(t)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mb-3 text-sm text-slate-500">{t.description}</p>
            <ul className="space-y-1 text-xs text-slate-500">
              {t.items.slice(0, 5).map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-slate-400">
                    {item.quantity} {unitLabel(item.unit)} · {formatMoney(item.unitPrice)}
                  </span>
                </li>
              ))}
              {t.items.length > 5 && <li className="text-slate-400">+{t.items.length - 5} más</li>}
            </ul>
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar plantilla" : "Nueva plantilla"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre *">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-slate-400">
                Trabajos incluidos
              </h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setForm((f) => ({ ...f, items: [...f.items, emptyTemplateItem()] }))}
              >
                <Plus className="h-3.5 w-3.5" /> Añadir
              </Button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-1.5">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="Nombre"
                    className="col-span-2"
                  />
                  <Select
                    value={item.pricingMethod}
                    onChange={(e) =>
                      updateItem(index, {
                        pricingMethod: e.target.value as TemplateItemInput["pricingMethod"],
                      })
                    }
                    className="col-span-1"
                  >
                    {PRICING_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {pricingMethodLabel(m)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={item.unit}
                    onChange={(e) =>
                      updateItem(index, { unit: e.target.value as TemplateItemInput["unit"] })
                    }
                    className="col-span-1"
                  >
                    {WORK_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {unitLabel(u)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    className="col-span-1"
                  />
                  <div className="col-span-1 flex items-center gap-1">
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-slate-300 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar plantilla"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
