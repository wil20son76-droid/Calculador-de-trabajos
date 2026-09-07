import Link from "next/link";
import { Users } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/shared/search-box";

export default async function CustomersPage({
  searchParams,
}: PageProps<"/clientes">) {
  const session = await requireSession();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const customers = await prisma.customer.findMany({
    where: {
      companyId: session.user.companyId,
      ...(query
        ? {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { companyName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { quotes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">{customers.length} clientes registrados</p>
        </div>
        <Button href="/clientes/nuevo">+ Nuevo cliente</Button>
      </div>

      <SearchBox placeholder="Buscar por nombre, empresa, email o ciudad..." />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
            <Users className="h-8 w-8" />
            <p>No se encontraron clientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Empresa</th>
                  <th className="px-5 py-3 font-medium">Ciudad</th>
                  <th className="px-5 py-3 font-medium">Teléfono</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Presupuestos</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {c.firstName} {c.lastName ?? ""}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.companyName ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.city ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.email ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c._count.quotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
