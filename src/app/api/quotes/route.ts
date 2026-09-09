import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { generateQuoteNumber } from "@/lib/quotes/service";
import { PRICING_METHODS, WORK_UNITS } from "@/lib/validation/price-list";
import { DEDUCTION_TYPES } from "@/lib/validation/quote";

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

// Un trabajo elegido en la multiselección de "Nuevo cálculo" (varias categorías,
// varios trabajos por categoría). Cada uno se convierte en una línea independiente.
const jobSelectionSchema = z.object({
  priceListItemId: z.string().optional().nullable(),
  categoryName: z.string().optional().nullable(),
  name: z.string().min(1),
  pricingMethod: z.enum(PRICING_METHODS),
  unit: z.enum(WORK_UNITS),
  defaultUnitPrice: z.coerce.number().min(0).default(0),
  deductionType: z.enum(DEDUCTION_TYPES).default("ROT"),
});

const createQuoteSchema = z.object({
  projectName: z.string().min(1, "El nombre del trabajo es obligatorio"),
  siteAddress: z.string().optional().nullable(),
  notesInternal: z.string().optional().nullable(),
  quoteDate: z.string().optional().nullable(),
  jobs: z.array(jobSelectionSchema).default([]),
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
        rotPercent: company.rotPercent,
        rutPercent: company.rutPercent,
        materialMarginDefaultPercent: company.defaultMaterialMarginPercent,
        items: {
          create: body.jobs.map((job, index) => ({
            priceListItemId: job.priceListItemId || null,
            categoryName: job.categoryName || null,
            name: job.name,
            pricingMethod: job.pricingMethod,
            unit: job.unit,
            quantity: 1,
            unitPrice: job.defaultUnitPrice,
            internalHourlyRate: company.defaultInternalHourlyRate,
            hourlyRate: company.defaultHourlyRate,
            deductionType: job.deductionType,
            sortOrder: index,
          })),
        },
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
