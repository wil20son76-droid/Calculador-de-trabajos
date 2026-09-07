import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MaterialManager } from "@/components/materials/material-manager";

export default async function MaterialsPage() {
  const session = await requireSession();

  const materials = await prisma.materialLibraryItem.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { name: "asc" },
  });

  const serialized = materials.map((m) => ({
    ...m,
    purchasePrice: Number(m.purchasePrice),
    marginPercent: Number(m.marginPercent),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Materiales</h1>
        <p className="text-sm text-slate-500">
          Biblioteca de materiales con precio de compra, margen y proveedor.
        </p>
      </div>
      <MaterialManager initialItems={serialized} />
    </div>
  );
}
