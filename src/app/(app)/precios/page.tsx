import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PriceListManager } from "@/components/price-list/price-list-manager";

export default async function PriceListPage() {
  const session = await requireSession();

  const [items, categories] = await Promise.all([
    prisma.priceListItem.findMany({
      where: { companyId: session.user.companyId },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    prisma.jobCategory.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const serialized = items.map((item) => ({
    ...item,
    defaultUnitPrice: Number(item.defaultUnitPrice),
    defaultHourlyRate: item.defaultHourlyRate != null ? Number(item.defaultHourlyRate) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Lista de precios</h1>
        <p className="text-sm text-slate-500">
          Trabajos habituales con su precio guardado. Se usan como punto de partida al crear un
          presupuesto, y siempre son editables dentro de cada oferta.
        </p>
      </div>
      <PriceListManager initialItems={serialized} categories={categories} />
    </div>
  );
}
