import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { QUOTE_FULL_INCLUDE } from "@/lib/quotes/service";
import { buildQuotePdfData } from "@/lib/quotes/pdf-data";
import { QuotePdfDocument, type PdfMode } from "@/lib/pdf/quote-document";
import { buildPdfFilename } from "@/lib/pdf/filename";

export async function GET(req: NextRequest, { params }: RouteContext<"/api/quotes/[id]/pdf">) {
  try {
    const companyId = await getCompanyId();
    const { id } = await params;
    const modeParam = req.nextUrl.searchParams.get("mode");
    const mode: PdfMode = modeParam === "fortnox" ? "fortnox" : "internal";

    const quote = await prisma.quote.findFirst({
      where: { id, companyId },
      include: QUOTE_FULL_INCLUDE,
    });
    if (!quote) {
      return NextResponse.json({ error: "Cálculo no encontrado" }, { status: 404 });
    }

    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });

    const data = buildQuotePdfData(quote);
    const buffer = await renderToBuffer(
      QuotePdfDocument({ companyName: company.name, mode, data })
    );

    const filename = buildPdfFilename(company.name, quote.projectName, quote.quoteDate);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
