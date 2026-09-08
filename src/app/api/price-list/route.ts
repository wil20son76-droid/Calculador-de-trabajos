import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { priceListItemSchema } from "@/lib/validation/price-list";

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const items = await prisma.priceListItem.findMany({
      where: {
        companyId: companyId,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const body = priceListItemSchema.parse(await req.json());

    const item = await prisma.priceListItem.create({
      data: { ...body, companyId: companyId, isSystem: false },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
