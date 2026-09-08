import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { materialLibraryItemSchema } from "@/lib/validation/material";

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const materials = await prisma.materialLibraryItem.findMany({
      where: {
        companyId: companyId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { supplier: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(materials);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const body = materialLibraryItemSchema.parse(await req.json());

    const material = await prisma.materialLibraryItem.create({
      data: { ...body, companyId: companyId },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
