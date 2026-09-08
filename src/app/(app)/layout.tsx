import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const companyId = await getCompanyId();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  return <AppShell companyName={company?.name ?? "Mi empresa"}>{children}</AppShell>;
}
