import Link from "next/link";
import { Plus, PaintRoller, Sun, LayoutGrid, ChefHat, Bath, Hammer } from "lucide-react";

import { getCompanyId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/utils/format";

const QUICK_CATEGORIES = [
  { name: "Pintura interior", icon: PaintRoller },
  { name: "Pintura exterior", icon: Sun },
  { name: "Suelos", icon: LayoutGrid },
  { name: "Cocina", icon: ChefHat },
  { name: "Baño", icon: Bath },
  { name: "Reforma general", icon: Hammer },
];

export default async function HomePage() {
  const companyId = await getCompanyId();

  const recentQuotes = await prisma.quote.findMany({
    where: { companyId },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { items: { select: { categoryName: true }, take: 1 } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Inicio</h1>
        <p className="text-sm text-slate-500">Herramienta interna de cálculo de trabajos</p>
      </div>

      <Card className="flex flex-col items-center gap-3 border-blue-200 bg-blue-50/60 py-10 text-center">
        <Button href="/presupuestos/nuevo" className="gap-2 px-8 py-3 text-base">
          <Plus className="h-5 w-5" />
          NUEVO CÁLCULO
        </Button>
        <p className="text-sm text-slate-500">
          Superficies, materiales, desperdicio, horas, coste y precio de venta
        </p>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Empezar desde una categoría</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_CATEGORIES.map(({ name, icon: Icon }) => (
            <Link
              key={name}
              href={`/presupuestos/nuevo?categoria=${encodeURIComponent(name)}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <Icon className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium text-slate-700">{name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Cálculos recientes</h2>
          <Link href="/presupuestos" className="text-sm font-medium text-blue-600 hover:underline">
            Ver todos
          </Link>
        </div>

        {recentQuotes.length === 0 ? (
          <Card className="py-10 text-center text-slate-400">
            Todavía no hay cálculos. Empieza con NUEVO CÁLCULO.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentQuotes.map((quote) => (
              <Link key={quote.id} href={`/presupuestos/${quote.id}`}>
                <Card className="h-full transition hover:border-blue-300 hover:shadow-md">
                  <p className="font-medium text-slate-900">
                    {quote.projectName || quote.quoteNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {quote.items[0]?.categoryName ?? "Sin categoría"} ·{" "}
                    {formatDate(quote.quoteDate)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatMoney(Number(quote.cachedTotalDue))}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
