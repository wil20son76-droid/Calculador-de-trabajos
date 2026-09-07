import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { templateSchema } from "@/lib/validation/template";

export async function GET() {
  try {
    const session = await requireSession();
    const templates = await prisma.template.findMany({
      where: { companyId: session.user.companyId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = templateSchema.parse(await req.json());

    const template = await prisma.template.create({
      data: {
        companyId: session.user.companyId,
        name: body.name,
        description: body.description,
        items: {
          create: body.items.map((item, index) => ({
            name: item.name,
            descriptionClient: item.descriptionClient,
            pricingMethod: item.pricingMethod,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sortOrder: index,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
