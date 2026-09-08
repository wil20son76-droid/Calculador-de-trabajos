"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NewQuoteForm({
  categories,
  initialCategory,
}: {
  categories: string[];
  initialCategory?: string;
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [quoteDate, setQuoteDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryName, setCategoryName] = useState(initialCategory ?? "");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!projectName.trim()) {
      setError("El nombre del trabajo/proyecto es obligatorio");
      return;
    }
    setError("");
    setCreating(true);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName: projectName.trim(),
        siteAddress: siteAddress.trim() || null,
        notesInternal: notesInternal.trim() || null,
        quoteDate,
        categoryName: categoryName || null,
      }),
    });
    setCreating(false);
    if (res.ok) {
      const quote = await res.json();
      router.push(`/presupuestos/${quote.id}`);
    } else {
      setError("No se pudo crear el cálculo. Inténtalo de nuevo.");
    }
  }

  return (
    <Card className="space-y-4">
      <Field label="Nombre del trabajo/proyecto *" hint='Ej. "Pintura apartamento 75 m²"'>
        <Input
          autoFocus
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Pintura apartamento 75 m²"
        />
      </Field>

      <Field label="Categoría de trabajo (opcional)">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryName(categoryName === c ? "" : c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                categoryName === c
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Dirección / referencia (opcional)">
        <Input
          value={siteAddress}
          onChange={(e) => setSiteAddress(e.target.value)}
          placeholder="Dirección de la obra"
        />
      </Field>

      <Field label="Fecha">
        <Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
      </Field>

      <Field label="Notas internas (opcional)">
        <Textarea
          rows={3}
          value={notesInternal}
          onChange={(e) => setNotesInternal(e.target.value)}
          placeholder="Notas solo visibles internamente"
        />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handleCreate} disabled={creating} className="w-full justify-center">
        {creating ? "Creando..." : "Crear cálculo"}
      </Button>
    </Card>
  );
}
