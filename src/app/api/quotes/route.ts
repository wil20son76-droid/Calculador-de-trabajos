import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { generateQuoteNumber } from "@/lib/quotes/service";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const status = req.nextUrl.searchParams.get("status")?.trim();

    const quotes = await prisma.quote.findMany({
      where: {
        companyId: session.user.companyId,
        ...(status ? { status: status as never } : {}),
        ...(q
          ? {
              OR: [
                { quoteNumber: { contains: q, mode: "insensitive" } },
                { projectName: { contains: q, mode: "insensitive" } },
                { customer: { firstName: { contains: q, mode: "insensitive" } } },
                { customer: { lastName: { contains: q, mode: "insensitive" } } },
                { customer: { companyName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    return handleApiError(error);
  }
}

const createQuoteSchema = z.object({ customerId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { customerId } = createQuoteSchema.parse(await req.json());

    const [company, customer] = await Promise.all([
      prisma.company.findUniqueOrThrow({ where: { id: session.user.companyId } }),
      prisma.customer.findFirst({
        where: { id: customerId, companyId: session.user.companyId },
      }),
    ]);
    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const quoteNumber = await generateQuoteNumber(session.user.companyId);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + company.quoteValidityDays);

    const quote = await prisma.quote.create({
      data: {
        companyId: session.user.companyId,
        quoteNumber,
        customerId: customer.id,
        status: "DRAFT",
        validUntil,
        currency: company.currency,
        vatRatePercent: company.vatRatePercent,
        rotEnabled: company.rotEnabledDefault,
        rotPercent: company.rotPercent,
        materialMarginDefaultPercent: company.defaultMaterialMarginPercent,
        termsText: company.defaultTermsText,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
