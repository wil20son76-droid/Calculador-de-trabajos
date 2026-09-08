import { getCompanyId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/shared/search-box";
import { QuoteListTable } from "@/components/quotes/quote-list-table";

export default async function QuotesPage({ searchParams }: PageProps<"/presupuestos">) {
  const companyId = await getCompanyId();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const quotes = await prisma.quote.findMany({
    where: {
      companyId,
      ...(query
        ? {
            OR: [
              { projectName: { contains: query, mode: "insensitive" as const } },
              { siteAddress: { contains: query, mode: "insensitive" as const } },
              { quoteNumber: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      items: { select: { categoryName: true, quantity: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = quotes.map((q) => {
    const categoryNames = Array.from(
      new Set(q.items.map((i) => i.categoryName).filter((c): c is string => !!c))
    );
    const surfaceM2 = q.items
      .filter((i) => i.unit === "M2")
      .reduce((sum, i) => sum + Number(i.quantity), 0);

    return {
      id: q.id,
      quoteNumber: q.quoteNumber,
      projectName: q.projectName,
      siteAddress: q.siteAddress,
      quoteDate: q.quoteDate.toISOString(),
      jobType: categoryNames.length > 0 ? categoryNames.join(", ") : "—",
      surfaceM2,
      laborTotal: Number(q.cachedLaborTotal),
      materialTotal: Number(q.cachedMaterialTotal),
      rotEnabled: q.rotEnabled,
      rotDeduction: Number(q.cachedRotDeduction),
      total: Number(q.cachedTotalDue),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mis cálculos</h1>
          <p className="text-sm text-slate-500">{quotes.length} cálculos guardados</p>
        </div>
        <Button href="/presupuestos/nuevo">+ Nuevo cálculo</Button>
      </div>

      <SearchBox placeholder="Buscar por nombre, dirección o referencia..." />

      <QuoteListTable quotes={serialized} />
    </div>
  );
}
