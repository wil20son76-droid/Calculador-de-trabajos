import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompanyId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { CustomerForm } from "@/components/customers/customer-form";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate, quoteStatusLabel, quoteStatusColor } from "@/lib/utils/format";

export default async function EditCustomerPage({ params }: PageProps<"/clientes/[id]">) {
  const companyId = await getCompanyId();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, companyId: companyId },
    include: { quotes: { orderBy: { createdAt: "desc" } } },
  });

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {customer.firstName} {customer.lastName}
        </h1>
        <p className="text-sm text-slate-500">Editar datos del cliente</p>
      </div>

      <CustomerForm customer={{ ...customer, email: customer.email ?? "" }} />

      {customer.quotes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Presupuestos de este cliente</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {customer.quotes.map((q) => (
              <Link
                key={q.id}
                href={`/presupuestos/${q.id}`}
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-blue-600">{q.quoteNumber}</p>
                  <p className="text-xs text-slate-400">{formatDate(q.quoteDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">
                    {formatMoney(Number(q.cachedTotalDue))}
                  </span>
                  <Badge className={quoteStatusColor(q.status)}>
                    {quoteStatusLabel(q.status)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
