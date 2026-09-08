import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { templateSchema } from "@/lib/validation/template";

export async function GET(_req: NextRequest, { params }: RouteContext<"/api/templates/[id]">) {
  try {
    const companyId = await getCompanyId();
    const { id } = await params;

    const template = await prisma.template.findFirst({
      where: { id, companyId: companyId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/templates/[id]">) {
  try {
    const companyId = await getCompanyId();
    const { id } = await params;
    const body = templateSchema.parse(await req.json());

    const existing = await prisma.template.findFirst({
      where: { id, companyId: companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.template.update({
        where: { id },
        data: { name: body.name, description: body.description },
      });
      await tx.templateItem.deleteMany({ where: { templateId: id } });
      for (const [index, item] of body.items.entries()) {
        await tx.templateItem.create({
          data: {
            templateId: id,
            name: item.name,
            descriptionClient: item.descriptionClient,
            pricingMethod: item.pricingMethod,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sortOrder: index,
          },
        });
      }
    });

    const template = await prisma.template.findUniqueOrThrow({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext<"/api/templates/[id]">) {
  try {
    const companyId = await getCompanyId();
    const { id } = await params;

    const existing = await prisma.template.findFirst({
      where: { id, companyId: companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    await prisma.template.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
