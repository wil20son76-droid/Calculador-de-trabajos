import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { priceListItemSchema } from "@/lib/validation/price-list";

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext<"/api/price-list/[id]">
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = priceListItemSchema.partial().parse(await req.json());

    const existing = await prisma.priceListItem.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const item = await prisma.priceListItem.update({ where: { id }, data: body });
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext<"/api/price-list/[id]">
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await prisma.priceListItem.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.priceListItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
