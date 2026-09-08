import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { generateQuoteNumber } from "@/lib/quotes/service";

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const quotes = await prisma.quote.findMany({
      where: {
        companyId: companyId,
        ...(q
          ? {
              OR: [
                { projectName: { contains: q, mode: "insensitive" } },
                { siteAddress: { contains: q, mode: "insensitive" } },
                { quoteNumber: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    return handleApiError(error);
  }
}

const createQuoteSchema = z.object({
  projectName: z.string().min(1, "El nombre del trabajo es obligatorio"),
  siteAddress: z.string().optional().nullable(),
  notesInternal: z.string().optional().nullable(),
  quoteDate: z.string().optional().nullable(),
  categoryName: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const body = createQuoteSchema.parse(await req.json());

    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });

    const quoteNumber = await generateQuoteNumber(companyId);

    const quote = await prisma.quote.create({
      data: {
        companyId: companyId,
        quoteNumber,
        status: "DRAFT",
        projectName: body.projectName,
        siteAddress: body.siteAddress || null,
        notesInternal: body.notesInternal || null,
        quoteDate: body.quoteDate ? new Date(body.quoteDate) : new Date(),
        currency: company.currency,
        vatRatePercent: company.vatRatePercent,
        rotEnabled: company.rotEnabledDefault,
        rotPercent: company.rotPercent,
        materialMarginDefaultPercent: company.defaultMaterialMarginPercent,
        ...(body.categoryName
          ? {
              items: {
                create: [
                  {
                    categoryName: body.categoryName,
                    name: body.categoryName,
                    pricingMethod: "PER_M2",
                    unit: "M2",
                    quantity: 0,
                    unitPrice: 0,
                    internalHourlyRate: company.defaultInternalHourlyRate,
                    hourlyRate: company.defaultHourlyRate,
                    rotEligible: true,
                    sortOrder: 0,
                  },
                ],
              },
            }
          : {}),
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
