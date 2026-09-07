import Link from "next/link";
import { Folder } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate, quoteStatusLabel, quoteStatusColor } from "@/lib/utils/format";

export default async function ProjectsPage() {
  const session = await requireSession();

  const quotes = await prisma.quote.findMany({
    where: {
      companyId: session.user.companyId,
      status: { in: ["ACCEPTED", "IN_PROGRESS", "COMPLETED", "INVOICED"] },
    },
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Proyectos</h1>
        <p className="text-sm text-slate-500">
          Presupuestos aceptados: obras en curso o finalizadas.
        </p>
      </div>

      {quotes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
          <Folder className="h-8 w-8" />
          <p>Todavía no hay proyectos. Un presupuesto se convierte en proyecto al ser aceptado.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <Link key={q.id} href={`/presupuestos/${q.id}`}>
              <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {q.projectName || q.quoteNumber}
                  </h3>
                  <Badge className={quoteStatusColor(q.status)}>{quoteStatusLabel(q.status)}</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {q.customer.firstName} {q.customer.lastName ?? ""}
                </p>
                <p className="text-xs text-slate-400">
                  {q.siteAddressDifferent ? q.siteAddress : q.customer.address}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">{formatDate(q.quoteDate)}</span>
                  <span className="font-medium text-slate-900">
                    {formatMoney(Number(q.cachedTotalDue))}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
