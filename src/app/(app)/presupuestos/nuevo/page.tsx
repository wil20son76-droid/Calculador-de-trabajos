import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NewQuoteForm } from "@/components/quotes/new-quote-form";

export default async function NewQuotePage() {
  const session = await requireSession();

  const customers = await prisma.customer.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Nuevo presupuesto</h1>
        <p className="text-sm text-slate-500">Elige el cliente para empezar</p>
      </div>
      <NewQuoteForm customers={customers} />
    </div>
  );
}
