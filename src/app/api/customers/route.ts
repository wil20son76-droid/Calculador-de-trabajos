import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handle-error";
import { customerSchema } from "@/lib/validation/customer";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: {
        companyId: session.user.companyId,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { companyName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { quotes: true } } },
    });

    return NextResponse.json(customers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = customerSchema.parse(await req.json());

    const customer = await prisma.customer.create({
      data: { ...body, companyId: session.user.companyId },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
