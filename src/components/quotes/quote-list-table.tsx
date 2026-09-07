"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate, quoteStatusLabel, quoteStatusColor } from "@/lib/utils/format";

interface QuoteRow {
  id: string;
  quoteNumber: string;
  status: string;
  projectName: string | null;
  quoteDate: string;
  customerName: string;
  siteAddress: string | null;
  total: number;
}

export function QuoteListTable({ quotes }: { quotes: QuoteRow[] }) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState<string | null>(null);

  async function handleDuplicate(id: string) {
    setDuplicating(id);
    const res = await fetch(`/api/quotes/${id}/duplicate`, { method: "POST" });
    setDuplicating(null);
    if (res.ok) {
      const copy = await res.json();
      router.push(`/presupuestos/${copy.id}`);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {quotes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
          <FileText className="h-8 w-8" />
          <p>No se encontraron presupuestos.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Proyecto</th>
                <th className="px-5 py-3 font-medium">Dirección</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Importe</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/presupuestos/${q.id}`} className="font-medium text-blue-600 hover:underline">
                      {q.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{q.customerName}</td>
                  <td className="px-5 py-3 text-slate-600">{q.projectName ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{q.siteAddress ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(q.quoteDate)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{formatMoney(q.total)}</td>
                  <td className="px-5 py-3">
                    <Badge className={quoteStatusColor(q.status)}>{quoteStatusLabel(q.status)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDuplicate(q.id)}
                      disabled={duplicating === q.id}
                      title="Duplicar presupuesto"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
