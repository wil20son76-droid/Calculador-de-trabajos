import { getCompanyId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NewQuoteForm } from "@/components/quotes/new-quote-form";

export default async function NewQuotePage({
  searchParams,
}: PageProps<"/presupuestos/nuevo">) {
  const companyId = await getCompanyId();
  const params = await searchParams;
  const categoria = typeof params.categoria === "string" ? params.categoria : "";

  const categories = await prisma.jobCategory.findMany({
    where: { companyId },
    orderBy: { sortOrder: "asc" },
    include: { priceListItems: { orderBy: { name: "asc" } } },
  });

  const groups = categories
    .filter((c) => c.priceListItems.length > 0)
    .map((c) => ({
      categoryName: c.name,
      jobs: c.priceListItems.map((job) => ({
        id: job.id,
        name: job.name,
        pricingMethod: job.pricingMethod,
        unit: job.unit,
        defaultUnitPrice: Number(job.defaultUnitPrice),
      })),
    }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Nuevo cálculo</h1>
        <p className="text-sm text-slate-500">
          Datos básicos del trabajo. No hace falta cliente: eso se gestiona en Fortnox.
        </p>
      </div>
      <NewQuoteForm groups={groups} initialCategory={categoria} />
    </div>
  );
}
