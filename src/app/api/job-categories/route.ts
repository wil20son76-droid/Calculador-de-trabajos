import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";

export async function GET() {
  try {
    const companyId = await getCompanyId();
    const categories = await prisma.jobCategory.findMany({
      where: { companyId: companyId },
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
    const companyId = await getCompanyId();
    const { name } = createCategorySchema.parse(await req.json());

    const count = await prisma.jobCategory.count({
      where: { companyId: companyId },
    });

    const category = await prisma.jobCategory.create({
      data: {
        companyId: companyId,
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
