import Link from "next/link";
import { FileText, TrendingUp, CheckCircle2, Clock, Target, DollarSign } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/quotes/stats";
import { StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate, quoteStatusLabel, quoteStatusColor } from "@/lib/utils/format";

export default async function DashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats(session.user.companyId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Resumen de tu actividad comercial</p>
        </div>
        <Button href="/presupuestos/nuevo">+ Nuevo presupuesto</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Presupuestos este mes"
          value={String(stats.monthlyQuotesCount)}
          icon={FileText}
        />
        <StatCard
          label="Valor total presupuestado (mes)"
          value={formatMoney(stats.totalQuotedThisMonth)}
          icon={TrendingUp}
        />
        <StatCard
          label="Presupuestos aceptados"
          value={String(stats.acceptedAllTime)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Presupuestos pendientes"
          value={String(stats.pendingCount)}
          hint="Borrador o enviado"
          icon={Clock}
        />
        <StatCard
          label="Tasa de aceptación"
          value={`${stats.acceptanceRate.toFixed(0)}%`}
          icon={Target}
        />
        <StatCard
          label="Facturación potencial"
          value={formatMoney(stats.potentialRevenue)}
          hint="Presupuestos enviados, pendientes de respuesta"
          icon={DollarSign}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Últimos presupuestos</h2>
          <Link href="/presupuestos" className="text-sm font-medium text-blue-600 hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Importe</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentQuotes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Todavía no hay presupuestos.
                  </td>
                </tr>
              )}
              {stats.recentQuotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/presupuestos/${quote.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {quote.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {quote.customer.firstName} {quote.customer.lastName ?? ""}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(quote.quoteDate)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {formatMoney(Number(quote.cachedTotalDue))}
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={quoteStatusColor(quote.status)}>
                      {quoteStatusLabel(quote.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
