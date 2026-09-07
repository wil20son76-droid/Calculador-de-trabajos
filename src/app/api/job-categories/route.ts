import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";

export async function GET() {
  try {
    const session = await requireSession();
    const categories = await prisma.jobCategory.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

const createCategorySchema = z.object({ name: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { name } = createCategorySchema.parse(await req.json());

    const count = await prisma.jobCategory.count({
      where: { companyId: session.user.companyId },
    });

    const category = await prisma.jobCategory.create({
      data: {
        companyId: session.user.companyId,
        key: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name,
        sortOrder: count,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
