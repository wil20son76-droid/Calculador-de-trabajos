"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney, pricingMethodLabel, unitLabel } from "@/lib/utils/format";
import type { PricingMethod, WorkUnit } from "@prisma/client";

export interface NewQuoteJobOption {
  id: string;
  name: string;
  pricingMethod: PricingMethod;
  unit: WorkUnit;
  defaultUnitPrice: number;
}

export interface NewQuoteCategoryGroup {
  categoryName: string;
  jobs: NewQuoteJobOption[];
}

export function NewQuoteForm({
  groups,
  initialCategory,
}: {
  groups: NewQuoteCategoryGroup[];
  initialCategory?: string;
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [quoteDate, setQuoteDate] = useState(() => new Date().toISOString().slice(0, 10));
  // Categorías "activas" (expandidas): marcar una categoría nueva nunca borra
  // los trabajos ya elegidos en otras categorías, solo añade/quita su panel.
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(initialCategory ? [initialCategory] : [])
  );
  const [selectedJobs, setSelectedJobs] = useState<Map<string, NewQuoteJobOption & { categoryName: string }>>(
    new Map()
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(categoryName: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  }

  function toggleJob(categoryName: string, job: NewQuoteJobOption) {
    setSelectedJobs((prev) => {
      const next = new Map(prev);
      if (next.has(job.id)) next.delete(job.id);
      else next.set(job.id, { ...job, categoryName });
      return next;
    });
  }

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
        jobs: Array.from(selectedJobs.values()).map((job) => ({
          priceListItemId: job.id,
          categoryName: job.categoryName,
          name: job.name,
          pricingMethod: job.pricingMethod,
          unit: job.unit,
          defaultUnitPrice: job.defaultUnitPrice,
          deductionType: "ROT",
        })),
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

      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">
          Trabajos a realizar <span className="text-slate-400">(opcional, se pueden añadir más luego)</span>
        </p>
        <p className="mb-2 text-xs text-slate-400">
          Puedes combinar varias categorías (pintura, suelos, cocina...) en el mismo cálculo. Cada
          trabajo marcado se añade como una línea independiente.
        </p>

        <div className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const active = activeCategories.has(group.categoryName);
            const countSelected = group.jobs.filter((j) => selectedJobs.has(j.id)).length;
            return (
              <button
                key={group.categoryName}
                type="button"
                onClick={() => toggleCategory(group.categoryName)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                {active ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {group.categoryName}
                {countSelected > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      active ? "bg-white/20" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {countSelected}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 space-y-3">
          {groups
            .filter((g) => activeCategories.has(g.categoryName))
            .map((group) => (
              <div
                key={group.categoryName}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.categoryName}
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {group.jobs.map((job) => (
                    <label
                      key={job.id}
                      className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-sm hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedJobs.has(job.id)}
                        onChange={() => toggleJob(group.categoryName, job)}
                      />
                      <span className="flex-1 text-slate-700">{job.name}</span>
                      <span className="text-xs text-slate-400">
                        {formatMoney(job.defaultUnitPrice)}/{unitLabel(job.unit)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {selectedJobs.size > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Array.from(selectedJobs.values()).map((job) => (
              <span
                key={job.id}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
                title={pricingMethodLabel(job.pricingMethod)}
              >
                {job.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handleCreate} disabled={creating} className="w-full justify-center">
        {creating ? "Creando..." : "Crear cálculo"}
      </Button>
    </Card>
  );
}
