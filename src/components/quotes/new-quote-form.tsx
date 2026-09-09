"use client";

import { useEffect, useRef, useState } from "react";
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

type SelectedJob = NewQuoteJobOption & { categoryName: string };

interface StoredDraft {
  projectName: string;
  siteAddress: string;
  notesInternal: string;
  quoteDate: string;
  activeCategories: string[];
  selectedJobs: SelectedJob[];
}

// Protege el trabajo de selección de trabajos antes de que exista ningún
// registro en PostgreSQL (sección 3 de la spec): si se cierra la pestaña, se
// recarga la página o se pierde la conexión mientras se está montando un
// cálculo nuevo, no hay nada que perder porque nada se ha guardado todavía —
// salvo esta copia local, que se ofrece recuperar al volver.
const DRAFT_KEY = "new-quote-draft";

function isMeaningfulDraft(d: StoredDraft): boolean {
  return d.projectName.trim() !== "" || d.selectedJobs.length > 0;
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
  const [selectedJobs, setSelectedJobs] = useState<Map<string, SelectedJob>>(new Map());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState<StoredDraft | null>(null);
  const isFirstRender = useRef(true);

  // Al montar: si hay un borrador de una sesión anterior sin terminar de crear, ofrecer recuperarlo.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredDraft;
      if (isMeaningfulDraft(parsed)) {
        // Lectura de localStorage (sistema externo) solo al montar: no hay forma
        // de derivar este estado durante el render, así que se fija aquí.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecovery(parsed);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // Borrador corrupto o localStorage no disponible: se ignora sin romper la página.
    }
  }, []);

  // En cada cambio, refrescar la copia local (excepto en el primer render, que
  // solo refleja lo que ya se cargó/decidió, para no pisar un borrador antes
  // de que el usuario decida recuperarlo o descartarlo).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const draft: StoredDraft = {
      projectName,
      siteAddress,
      notesInternal,
      quoteDate,
      activeCategories: Array.from(activeCategories),
      selectedJobs: Array.from(selectedJobs.values()),
    };
    try {
      if (isMeaningfulDraft(draft)) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // localStorage lleno o no disponible: no crítico en esta pantalla.
    }
  }, [projectName, siteAddress, notesInternal, quoteDate, activeCategories, selectedJobs]);

  function recoverDraft() {
    if (!recovery) return;
    setProjectName(recovery.projectName);
    setSiteAddress(recovery.siteAddress);
    setNotesInternal(recovery.notesInternal);
    setQuoteDate(recovery.quoteDate);
    setActiveCategories(new Set(recovery.activeCategories));
    setSelectedJobs(new Map(recovery.selectedJobs.map((j) => [j.id, j])));
    setRecovery(null);
  }

  function discardDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // no-op
    }
    setRecovery(null);
  }

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
      // Ya existe de forma permanente en PostgreSQL: el borrador local deja de hacer falta.
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // no-op
      }
      router.push(`/presupuestos/${quote.id}`);
    } else {
      setError("No se pudo crear el cálculo. Inténtalo de nuevo.");
    }
  }

  return (
    <Card className="space-y-4">
      {recovery && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="mb-2 text-sm text-amber-900">
            Se encontró un cálculo sin guardar. ¿Deseas recuperarlo?
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
      )}

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
        {creating ? "Guardando..." : "Guardar proyecto"}
      </Button>
    </Card>
  );
}
