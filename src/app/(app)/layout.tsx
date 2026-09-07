import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true },
  });

  return (
    <AppShell companyName={company?.name ?? "Mi empresa"} userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </AppShell>
  );
}
