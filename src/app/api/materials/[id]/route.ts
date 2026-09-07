import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { materialLibraryItemSchema } from "@/lib/validation/material";

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/materials/[id]">) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = materialLibraryItemSchema.partial().parse(await req.json());

    const existing = await prisma.materialLibraryItem.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const material = await prisma.materialLibraryItem.update({ where: { id }, data: body });
    return NextResponse.json(material);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext<"/api/materials/[id]">
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await prisma.materialLibraryItem.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.materialLibraryItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
