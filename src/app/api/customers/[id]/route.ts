import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { customerSchema } from "@/lib/validation/customer";

export async function GET(_req: NextRequest, { params }: RouteContext<"/api/customers/[id]">) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/customers/[id]">) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = customerSchema.partial().parse(await req.json());

    const existing = await prisma.customer.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const customer = await prisma.customer.update({ where: { id }, data: body });
    return NextResponse.json(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext<"/api/customers/[id]">
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await prisma.customer.findFirst({
      where: { id, companyId: session.user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
