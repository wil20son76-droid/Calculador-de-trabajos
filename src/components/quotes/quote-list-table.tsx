"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileText, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatMoney, formatDate, formatNumber } from "@/lib/utils/format";

interface QuoteRow {
  id: string;
  quoteNumber: string;
  projectName: string | null;
  siteAddress: string | null;
  quoteDate: string;
  jobType: string;
  surfaceM2: number;
  laborTotal: number;
  materialTotal: number;
  rotDeduction: number;
  rutDeduction: number;
  total: number;
}

export function QuoteListTable({ quotes }: { quotes: QuoteRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDuplicate(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/quotes/${id}/duplicate`, { method: "POST" });
    setBusyId(null);
    if (res.ok) {
      const copy = await res.json();
      router.push(`/presupuestos/${copy.id}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cálculo? Esta acción no se puede deshacer.")) return;
    setBusyId(id);
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  if (quotes.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
        <FileText className="h-8 w-8" />
        <p>Todavía no hay cálculos guardados.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {quotes.map((q) => (
        <Card key={q.id} className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/presupuestos/${q.id}`}
                className="font-semibold text-slate-900 hover:text-blue-600 hover:underline"
              >
                {q.projectName || "(sin nombre)"}
              </Link>
              <p className="text-xs text-slate-400">
                {q.quoteNumber} · {formatDate(q.quoteDate)}
              </p>
              {q.siteAddress && <p className="text-xs text-slate-400">{q.siteAddress}</p>}
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {q.jobType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[11px] uppercase text-slate-400">Superficie</p>
              <p className="font-medium text-slate-800">
                {q.surfaceM2 > 0 ? `${formatNumber(q.surfaceM2, 1)} m²` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-400">Trabajo</p>
              <p className="font-medium text-slate-800">{formatMoney(q.laborTotal)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-400">Material</p>
              <p className="font-medium text-slate-800">{formatMoney(q.materialTotal)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-400">ROT/RUT</p>
              <p className="font-medium text-slate-800">
                {q.rotDeduction + q.rutDeduction > 0
                  ? `-${formatMoney(q.rotDeduction + q.rutDeduction)}`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-slate-900">{formatMoney(q.total)}</span>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/presupuestos/${q.id}`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Abrir / Editar
              </Link>
              <button
                onClick={() => handleDuplicate(q.id)}
                disabled={busyId === q.id}
                title="Duplicar cálculo"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(q.id)}
                disabled={busyId === q.id}
                title="Eliminar cálculo"
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
