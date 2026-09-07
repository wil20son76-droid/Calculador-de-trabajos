import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { QUOTE_FULL_INCLUDE, toCalcInput } from "@/lib/quotes/service";
import { calcQuote, calcItem } from "@/lib/calc/engine";
import { formatDate } from "@/lib/utils/format";
import { QuotePdfDocument, type PdfItem } from "@/lib/pdf/quote-document";

export async function GET(_req: NextRequest, { params }: RouteContext<"/api/quotes/[id]/pdf">) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const quote = await prisma.quote.findFirst({
      where: { id, companyId: session.user.companyId },
      include: QUOTE_FULL_INCLUDE,
    });
    if (!quote) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: session.user.companyId },
    });

    const calcInput = toCalcInput(quote);
    const result = calcQuote(calcInput);

    const items: PdfItem[] = quote.items.map((item, index) => {
      const itemResult = calcItem(calcInput.items[index]);
      return {
        name: item.name,
        descriptionClient: item.descriptionClient,
        pricingMethod: item.pricingMethod,
        unit: item.unit,
        quantity: itemResult.effectiveQuantity,
        unitPrice: itemResult.effectiveUnitPrice,
        lineTotal: itemResult.lineTotal,
        laborTotalHours: itemResult.laborTotalHours,
        hourlyRate: item.hourlyRate != null ? Number(item.hourlyRate) : null,
        materials: itemResult.materials.map((m, mIndex) => ({
          name: item.materials[mIndex].name,
          quantity: m.quantity,
          unit: item.materials[mIndex].unit,
          total: m.total,
        })),
      };
    });

    const buffer = await renderToBuffer(
      QuotePdfDocument({
        company: {
          name: company.name,
          orgNumber: company.orgNumber,
          vatNumber: company.vatNumber,
          address: company.address,
          postalCode: company.postalCode,
          city: company.city,
          phone: company.phone,
          email: company.email,
          website: company.website,
          bankgiro: company.bankgiro,
          plusgiro: company.plusgiro,
          swish: company.swish,
        },
        customer: {
          firstName: quote.customer.firstName,
          lastName: quote.customer.lastName,
          companyName: quote.customer.companyName,
          address: quote.customer.address,
          postalCode: quote.customer.postalCode,
          city: quote.customer.city,
          phone: quote.customer.phone,
          email: quote.customer.email,
          personalOrgNumber: quote.customer.personalOrgNumber,
        },
        quoteNumber: quote.quoteNumber,
        quoteDate: formatDate(quote.quoteDate),
        validUntil: quote.validUntil ? formatDate(quote.validUntil) : null,
        projectName: quote.projectName,
        projectDescription: quote.projectDescription,
        siteAddress: quote.siteAddressDifferent ? quote.siteAddress : null,
        currency: quote.currency,
        items,
        result,
        rotEnabled: quote.rotEnabled,
        includedText: quote.includedText,
        excludedText: quote.excludedText,
        termsText: quote.termsText,
        notesClient: quote.notesClient,
        showHours: quote.showHours,
        showHourlyRate: quote.showHourlyRate,
        showMaterialsIndividually: quote.showMaterialsIndividually,
        showMaterialPrices: quote.showMaterialPrices,
        showUnitPrice: quote.showUnitPrice,
        showOnlyTotalPerJob: quote.showOnlyTotalPerJob,
        showMaterialsOnPdf: quote.showMaterialsOnPdf,
      })
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quote.quoteNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
