"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { CustomerInput } from "@/lib/validation/customer";

type Customer = CustomerInput & { id?: string };

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const [form, setForm] = useState<CustomerInput>({
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    companyName: customer?.companyName ?? "",
    address: customer?.address ?? "",
    postalCode: customer?.postalCode ?? "",
    city: customer?.city ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    personalOrgNumber: customer?.personalOrgNumber ?? "",
    notes: customer?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = customer?.id ? `/api/customers/${customer.id}` : "/api/customers";
    const method = customer?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      setError("No se pudo guardar el cliente. Revisa los datos.");
      return;
    }

    const saved = await res.json();
    router.push(`/clientes/${saved.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!customer?.id) return;
    if (!confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/clientes");
      router.refresh();
    } else {
      setError("No se pudo eliminar el cliente (puede tener presupuestos asociados).");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Datos personales</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <Input
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </Field>
          <Field label="Apellido">
            <Input
              value={form.lastName ?? ""}
              onChange={(e) => update("lastName", e.target.value)}
            />
          </Field>
          <Field label="Empresa (si corresponde)">
            <Input
              value={form.companyName ?? ""}
              onChange={(e) => update("companyName", e.target.value)}
            />
          </Field>
          <Field label="Personnummer / Organisationsnummer">
            <Input
              value={form.personalOrgNumber ?? ""}
              onChange={(e) => update("personalOrgNumber", e.target.value)}
            />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Dirección</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Notas</h2>
        <Textarea
          rows={3}
          value={form.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Notas internas sobre el cliente..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cliente"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
        {customer?.id && (
          <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        )}
      </div>
    </form>
  );
}
