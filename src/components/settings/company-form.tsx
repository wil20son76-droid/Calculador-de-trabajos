"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { CompanyInput } from "@/lib/validation/company";

export function CompanyForm({ company }: { company: CompanyInput }) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyInput>(company);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
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
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Datos de la empresa</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre de empresa *" className="sm:col-span-2">
            <Input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Organisationsnummer">
            <Input
              value={form.orgNumber ?? ""}
              onChange={(e) => update("orgNumber", e.target.value)}
            />
          </Field>
          <Field label="VAT number">
            <Input
              value={form.vatNumber ?? ""}
              onChange={(e) => update("vatNumber", e.target.value)}
            />
          </Field>
          <Field label="Dirección" className="sm:col-span-2">
            <Input value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <Field label="Código postal">
            <Input
              value={form.postalCode ?? ""}
              onChange={(e) => update("postalCode", e.target.value)}
            />
          </Field>
          <Field label="Ciudad">
            <Input value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="Web">
            <Input value={form.website ?? ""} onChange={(e) => update("website", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Datos de pago</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Bankgiro">
            <Input
              value={form.bankgiro ?? ""}
              onChange={(e) => update("bankgiro", e.target.value)}
            />
          </Field>
          <Field label="Plusgiro">
            <Input
              value={form.plusgiro ?? ""}
              onChange={(e) => update("plusgiro", e.target.value)}
            />
          </Field>
          <Field label="Swish">
            <Input value={form.swish ?? ""} onChange={(e) => update("swish", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Moneda, impuestos y valores por defecto
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Estos porcentajes son configurables porque las normas fiscales suecas (moms, ROT) pueden
          cambiar. Nunca están fijados en el código.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Moneda">
            <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
          </Field>
          <Field label="Moms / IVA %">
            <Input
              type="number"
              step="0.1"
              value={form.vatRatePercent}
              onChange={(e) => update("vatRatePercent", Number(e.target.value))}
            />
          </Field>
          <Field label="Validez de oferta (días)">
            <Input
              type="number"
              value={form.quoteValidityDays}
              onChange={(e) => update("quoteValidityDays", Number(e.target.value))}
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
          <Field label="Tope ROT por presupuesto (SEK, opcional)">
            <Input
              type="number"
              value={form.rotMaxDeductionPerQuote ?? ""}
              onChange={(e) =>
                update(
                  "rotMaxDeductionPerQuote",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </Field>
          <Field label="ROT activado por defecto">
            <label className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
              <input
                type="checkbox"
                checked={form.rotEnabledDefault}
                onChange={(e) => update("rotEnabledDefault", e.target.checked)}
              />
              {form.rotEnabledDefault ? "Sí" : "No"}
            </label>
          </Field>
          <Field label="Precio hora predeterminado (SEK)">
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
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Condiciones estándar</h2>
        <Textarea
          rows={5}
          value={form.defaultTermsText ?? ""}
          onChange={(e) => update("defaultTermsText", e.target.value)}
        />
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
