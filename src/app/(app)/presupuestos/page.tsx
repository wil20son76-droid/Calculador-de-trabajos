import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/shared/search-box";
import { QuoteStatusFilter } from "@/components/quotes/quote-status-filter";
import { QuoteListTable } from "@/components/quotes/quote-list-table";
import { QUOTE_STATUSES } from "@/lib/validation/quote";
import type { Prisma } from "@prisma/client";

export default async function QuotesPage({
  searchParams,
}: PageProps<"/presupuestos">) {
  const session = await requireSession();
  const { q, status } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const statusFilter = typeof status === "string" ? status : "";

  const where: Prisma.QuoteWhereInput = {
    companyId: session.user.companyId,
    ...(statusFilter && QUOTE_STATUSES.includes(statusFilter as never)
      ? { status: statusFilter as Prisma.EnumQuoteStatusFilter["equals"] }
      : {}),
    ...(query
      ? {
          OR: [
            { quoteNumber: { contains: query, mode: "insensitive" } },
            { projectName: { contains: query, mode: "insensitive" } },
            { customer: { firstName: { contains: query, mode: "insensitive" } } },
            { customer: { lastName: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const quotes = await prisma.quote.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const serialized = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    status: q.status,
    projectName: q.projectName,
    quoteDate: q.quoteDate.toISOString(),
    customerName: `${q.customer.firstName} ${q.customer.lastName ?? ""}`.trim(),
    siteAddress: q.siteAddressDifferent ? q.siteAddress : q.customer.address,
    total: Number(q.cachedTotalDue),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Presupuestos</h1>
          <p className="text-sm text-slate-500">{quotes.length} presupuestos</p>
        </div>
        <Button href="/presupuestos/nuevo">+ Nuevo presupuesto</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox placeholder="Buscar por número, cliente o proyecto..." />
        <QuoteStatusFilter />
      </div>

      <QuoteListTable quotes={serialized} />
    </div>
  );
}
