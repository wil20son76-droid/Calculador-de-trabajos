import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { companySchema } from "@/lib/validation/company";

export async function GET() {
  try {
    const companyId = await getCompanyId();
    const company = await prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });
    return NextResponse.json(company);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const companyId = await getCompanyId();
    const body = companySchema.partial().parse(await req.json());

    const company = await prisma.company.update({
      where: { id: companyId },
      data: body,
    });

    return NextResponse.json(company);
  } catch (error) {
    return handleApiError(error);
  }
}
