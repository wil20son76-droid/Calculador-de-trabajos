import { notFound } from "next/navigation";

import { getCompanyId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { QUOTE_FULL_INCLUDE, type QuoteWithRelations } from "@/lib/quotes/service";
import { QuoteEditor } from "@/components/quotes/quote-editor";
import type { QuoteDraft } from "@/lib/quotes/draft-types";

export default async function QuoteDetailPage({ params }: PageProps<"/presupuestos/[id]">) {
  const companyId = await getCompanyId();
  const { id } = await params;

  const [quote, priceListItems, materialLibrary, categories, templates] = await Promise.all([
    prisma.quote.findFirst({
      where: { id, companyId },
      include: QUOTE_FULL_INCLUDE,
    }),
    prisma.priceListItem.findMany({
      where: { companyId },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.materialLibraryItem.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
    prisma.jobCategory.findMany({
      where: { companyId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.template.findMany({
      where: { companyId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!quote) notFound();

  function mapMaterial(m: QuoteWithRelations["generalMaterials"][number]) {
    return {
      id: m.id,
      materialLibraryItemId: m.materialLibraryItemId,
      categoryName: m.categoryName,
      name: m.name,
      description: m.description,
      supplier: m.supplier,
      notes: m.notes,
      quantity: Number(m.quantity),
      unit: m.unit,
      purchasePrice: Number(m.purchasePrice),
      marginPercent: Number(m.marginPercent),
      calcType: m.calcType,
      coveragePerUnit: m.coveragePerUnit != null ? Number(m.coveragePerUnit) : null,
      coats: m.coats,
      wastePercent: Number(m.wastePercent),
      packageSize: m.packageSize != null ? Number(m.packageSize) : null,
      containerSizes: Array.isArray(m.containerSizes) ? (m.containerSizes as number[]) : null,
      baseQuantity: m.baseQuantity != null ? Number(m.baseQuantity) : null,
      calculatedQuantity: m.calculatedQuantity != null ? Number(m.calculatedQuantity) : null,
    };
  }

  const draft: QuoteDraft = {
    projectName: quote.projectName ?? "",
    siteAddress: quote.siteAddress ?? "",
    notesInternal: quote.notesInternal ?? "",
    quoteDate: quote.quoteDate.toISOString().slice(0, 10),
    currency: quote.currency,
    vatRatePercent: Number(quote.vatRatePercent),
    rotPercent: Number(quote.rotPercent),
    rutPercent: Number(quote.rutPercent),
    discountType: quote.discountType,
    discountValue: Number(quote.discountValue),
    materialMarginDefaultPercent: Number(quote.materialMarginDefaultPercent),
    rooms: quote.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      length: Number(room.length),
      width: Number(room.width),
      height: Number(room.height),
      openings: room.openings.map((o) => ({
        id: o.id,
        type: o.type,
        width: Number(o.width),
        height: Number(o.height),
        quantity: o.quantity,
      })),
    })),
    items: quote.items.map((item) => ({
      id: item.id,
      priceListItemId: item.priceListItemId,
      categoryName: item.categoryName,
      name: item.name,
      descriptionInternal: item.descriptionInternal,
      descriptionClient: item.descriptionClient,
      pricingMethod: item.pricingMethod,
      unit: item.unit,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      useDetailedLabor: item.useDetailedLabor,
      workerCount: item.workerCount != null ? Number(item.workerCount) : null,
      hoursPerWorker: item.hoursPerWorker != null ? Number(item.hoursPerWorker) : null,
      hourlyRate: item.hourlyRate != null ? Number(item.hourlyRate) : null,
      internalHourlyRate: item.internalHourlyRate != null ? Number(item.internalHourlyRate) : null,
      discountType: item.discountType,
      discountValue: Number(item.discountValue),
      companyCost: item.companyCost != null ? Number(item.companyCost) : null,
      deductionType: item.deductionType,
      measurementSource: item.measurementSource,
      subtractOpeningWidths: item.subtractOpeningWidths,
      roomIds: item.rooms.map((r) => r.roomId),
      materials: item.materials.map(mapMaterial),
    })),
    otherCosts: quote.otherCosts.map((c) => ({
      id: c.id,
      name: c.name,
      quantity: Number(c.quantity),
      unitPrice: Number(c.unitPrice),
    })),
    generalMaterials: quote.generalMaterials.map(mapMaterial),
  };

  const serializedPriceList = priceListItems.map((p) => ({
    id: p.id,
    name: p.name,
    categoryName: p.category?.name ?? null,
    pricingMethod: p.pricingMethod,
    unit: p.unit,
    defaultUnitPrice: Number(p.defaultUnitPrice),
    defaultHourlyRate: p.defaultHourlyRate != null ? Number(p.defaultHourlyRate) : null,
  }));

  const serializedMaterials = materialLibrary.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    purchasePrice: Number(m.purchasePrice),
    marginPercent: Number(m.marginPercent),
    calcType: m.calcType,
    coveragePerUnit: m.coveragePerUnit != null ? Number(m.coveragePerUnit) : null,
    coatsDefault: m.coatsDefault,
    wastePercentDefault: Number(m.wastePercentDefault),
    packageSize: m.packageSize != null ? Number(m.packageSize) : null,
    containerSizes: Array.isArray(m.containerSizes) ? (m.containerSizes as number[]) : null,
  }));

  return (
    <QuoteEditor
      quoteId={quote.id}
      quoteNumber={quote.quoteNumber}
      createdAt={quote.createdAt.toISOString()}
      updatedAt={quote.updatedAt.toISOString()}
      initialDraft={draft}
      priceListItems={serializedPriceList}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      materialLibrary={serializedMaterials}
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        items: t.items.map((i) => ({
          name: i.name,
          descriptionClient: i.descriptionClient,
          pricingMethod: i.pricingMethod,
          unit: i.unit,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      }))}
    />
  );
}
