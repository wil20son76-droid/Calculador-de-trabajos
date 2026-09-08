"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { CalcSettingsInput } from "@/lib/validation/company";

export function CompanyForm({ settings }: { settings: CalcSettingsInput }) {
  const router = useRouter();
  const [form, setForm] = useState<CalcSettingsInput>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof CalcSettingsInput>(key: K, value: CalcSettingsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Moneda e idioma</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Moneda">
            <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
          </Field>
          <Field label="Idioma">
            <Select value={form.locale} onChange={(e) => update("locale", e.target.value)}>
              <option value="sv">Svenska</option>
              <option value="es">Español</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Moms y ROT-avdrag</h2>
        <p className="mb-4 text-xs text-slate-400">
          Estos porcentajes son configurables porque las normas fiscales suecas (moms, ROT) pueden
          cambiar. Nunca están fijados en el código. Cada cálculo guarda el % de ROT usado en ese
          momento, así que los cálculos antiguos no cambian si luego actualizas este valor.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Moms / IVA %">
            <Input
              type="number"
              step="0.1"
              value={form.vatRatePercent}
              onChange={(e) => update("vatRatePercent", Number(e.target.value))}
            />
          </Field>
          <Field label="ROT % deducible">
            <Input
              type="number"
              step="0.1"
              value={form.rotPercent}
              onChange={(e) => update("rotPercent", Number(e.target.value))}
            />
          </Field>
          <Field label="Tope ROT por cálculo (SEK, opcional)">
            <Input
              type="number"
              value={form.rotMaxDeductionPerQuote ?? ""}
              onChange={(e) =>
                update("rotMaxDeductionPerQuote", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="ROT activado por defecto en nuevos cálculos">
            <label className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
              <input
                type="checkbox"
                checked={form.rotEnabledDefault}
                onChange={(e) => update("rotEnabledDefault", e.target.checked)}
              />
              {form.rotEnabledDefault ? "Sí" : "No"}
            </label>
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">
          Valores predeterminados de cálculo
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Se usan como punto de partida en cada trabajo y material nuevo; siempre se pueden ajustar
          en el propio cálculo sin afectar a este valor por defecto.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Coste interno por hora predeterminado (SEK)">
            <Input
              type="number"
              value={form.defaultInternalHourlyRate}
              onChange={(e) => update("defaultInternalHourlyRate", Number(e.target.value))}
            />
          </Field>
          <Field label="Precio cliente por hora predeterminado (SEK)">
            <Input
              type="number"
              value={form.defaultHourlyRate}
              onChange={(e) => update("defaultHourlyRate", Number(e.target.value))}
            />
          </Field>
          <Field label="Margen de materiales predeterminado (%)">
            <Input
              type="number"
              step="0.1"
              value={form.defaultMaterialMarginPercent}
              onChange={(e) => update("defaultMaterialMarginPercent", Number(e.target.value))}
            />
          </Field>
          <Field label="Desperdicio predeterminado (%)">
            <Input
              type="number"
              step="0.1"
              value={form.defaultWastePercent}
              onChange={(e) => update("defaultWastePercent", Number(e.target.value))}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          El desperdicio predeterminado solo se usa como respaldo cuando un material no tiene su
          propio % de desperdicio configurado en la biblioteca.
        </p>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar configuración"}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Guardado correctamente</span>}
      </div>
    </form>
  );
}
