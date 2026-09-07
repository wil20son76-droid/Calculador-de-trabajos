import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { companySchema } from "@/lib/validation/company";

export async function GET() {
  try {
    const session = await requireSession();
    const company = await prisma.company.findUniqueOrThrow({
      where: { id: session.user.companyId },
    });
    return NextResponse.json(company);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = companySchema.partial().parse(await req.json());

    const company = await prisma.company.update({
      where: { id: session.user.companyId },
      data: body,
    });

    return NextResponse.json(company);
  } catch (error) {
    return handleApiError(error);
  }
}
