import { getCompanyId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TemplateManager } from "@/components/templates/template-manager";

export default async function TemplatesPage() {
  const companyId = await getCompanyId();

  const templates = await prisma.template.findMany({
    where: { companyId: companyId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });

  const serialized = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    items: t.items.map((i) => ({
      id: i.id,
      name: i.name,
      descriptionClient: i.descriptionClient,
      pricingMethod: i.pricingMethod,
      unit: i.unit,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Plantillas</h1>
        <p className="text-sm text-slate-500">
          Precarga trabajos habituales en un nuevo presupuesto. Después puedes modificar
          cantidades y precios libremente.
        </p>
      </div>
      <TemplateManager initialTemplates={serialized} />
    </div>
  );
}
