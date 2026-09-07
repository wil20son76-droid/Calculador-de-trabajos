import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { QUOTE_FULL_INCLUDE } from "@/lib/quotes/service";
import { QuoteEditor } from "@/components/quotes/quote-editor";
import type { QuoteDraft } from "@/lib/quotes/draft-types";

export default async function QuoteDetailPage({ params }: PageProps<"/presupuestos/[id]">) {
  const session = await requireSession();
  const { id } = await params;

  const [quote, customers, priceListItems, materialLibrary, categories, templates] = await Promise.all([
    prisma.quote.findFirst({
      where: { id, companyId: session.user.companyId },
      include: QUOTE_FULL_INCLUDE,
    }),
    prisma.customer.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { firstName: "asc" },
    }),
    prisma.priceListItem.findMany({
      where: { companyId: session.user.companyId },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.materialLibraryItem.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { name: "asc" },
    }),
    prisma.jobCategory.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.template.findMany({
      where: { companyId: session.user.companyId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!quote) notFound();

  const draft: QuoteDraft = {
    status: quote.status,
    customerId: quote.customerId,
    projectName: quote.projectName ?? "",
    projectDescription: quote.projectDescription ?? "",
    siteAddressDifferent: quote.siteAddressDifferent,
    siteAddress: quote.siteAddress ?? "",
    sitePostalCode: quote.sitePostalCode ?? "",
    siteCity: quote.siteCity ?? "",
    quoteDate: quote.quoteDate.toISOString().slice(0, 10),
    validUntil: quote.validUntil ? quote.validUntil.toISOString().slice(0, 10) : "",
    currency: quote.currency,
    vatRatePercent: Number(quote.vatRatePercent),
    rotEnabled: quote.rotEnabled,
    rotPercent: Number(quote.rotPercent),
    discountType: quote.discountType,
    discountValue: Number(quote.discountValue),
    materialMarginDefaultPercent: Number(quote.materialMarginDefaultPercent),
    showHours: quote.showHours,
    showHourlyRate: quote.showHourlyRate,
    showMaterialsIndividually: quote.showMaterialsIndividually,
    showMaterialPrices: quote.showMaterialPrices,
    showUnitPrice: quote.showUnitPrice,
    showOnlyTotalPerJob: quote.showOnlyTotalPerJob,
    showMaterialsOnPdf: quote.showMaterialsOnPdf,
    includedText: quote.includedText ?? "",
    excludedText: quote.excludedText ?? "",
    termsText: quote.termsText ?? "",
    notesInternal: quote.notesInternal ?? "",
    notesClient: quote.notesClient ?? "",
    items: quote.items.map((item) => ({
      id: item.id,
      priceListItemId: item.priceListItemId,
      categoryName: item.categoryName,
      name: item.name,
      descriptionInternal: item.descriptionInternal,
      descriptionClient: item.descriptionClient,
      includedText: item.includedText,
      excludedText: item.excludedText,
      pricingMethod: item.pricingMethod,
      unit: item.unit,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      useDetailedLabor: item.useDetailedLabor,
      workerCount: item.workerCount != null ? Number(item.workerCount) : null,
      hoursPerWorker: item.hoursPerWorker != null ? Number(item.hoursPerWorker) : null,
      hourlyRate: item.hourlyRate != null ? Number(item.hourlyRate) : null,
      discountType: item.discountType,
      discountValue: Number(item.discountValue),
      companyCost: item.companyCost != null ? Number(item.companyCost) : null,
      materials: item.materials.map((m) => ({
        id: m.id,
        materialLibraryItemId: m.materialLibraryItemId,
        name: m.name,
        description: m.description,
        quantity: Number(m.quantity),
        unit: m.unit,
        purchasePrice: Number(m.purchasePrice),
        marginPercent: Number(m.marginPercent),
      })),
    })),
    otherCosts: quote.otherCosts.map((c) => ({
      id: c.id,
      name: c.name,
      quantity: Number(c.quantity),
      unitPrice: Number(c.unitPrice),
    })),
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
  }));

  return (
    <QuoteEditor
      quoteId={quote.id}
      quoteNumber={quote.quoteNumber}
      initialDraft={draft}
      customers={customers.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        companyName: c.companyName,
        address: c.address,
        city: c.city,
      }))}
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
