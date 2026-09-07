"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Field, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  firstName: string;
  lastName: string | null;
  companyName: string | null;
}

export function NewQuoteForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!customerId) return;
    setCreating(true);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });
    setCreating(false);
    if (res.ok) {
      const quote = await res.json();
      router.push(`/presupuestos/${quote.id}`);
    }
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="mb-4 text-sm text-slate-600">
          Todavía no tienes clientes. Crea uno primero para poder generar un presupuesto.
        </p>
        <Button href="/clientes/nuevo">+ Nuevo cliente</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Field label="Cliente">
        <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName ?? ""} {c.companyName ? `(${c.companyName})` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <div className="mt-5 flex items-center gap-3">
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? "Creando..." : "Crear presupuesto"}
        </Button>
        <Link href="/clientes/nuevo" className="text-sm text-blue-600 hover:underline">
          + Nuevo cliente
        </Link>
      </div>
    </div>
  );
}
