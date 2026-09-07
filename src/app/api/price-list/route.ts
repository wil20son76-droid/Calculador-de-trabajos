import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { priceListItemSchema } from "@/lib/validation/price-list";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const items = await prisma.priceListItem.findMany({
      where: {
        companyId: session.user.companyId,
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
    const session = await requireSession();
    const body = priceListItemSchema.parse(await req.json());

    const item = await prisma.priceListItem.create({
      data: { ...body, companyId: session.user.companyId, isSystem: false },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
