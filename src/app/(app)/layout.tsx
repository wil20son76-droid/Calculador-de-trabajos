import { prisma } from "@/lib/db/prisma";
import { getCompanyId } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

// Todas las páginas bajo este layout consultan Prisma (directamente o a través
// de getCompanyId) para obtener la empresa/configuración activa. Sin esto,
// `next build` intentaría prerenderizar como estáticas las rutas que no usan
// ninguna API de request-time propia (p.ej. "/", "/configuracion",
// "/materiales", "/precios", "/plantillas", "/proyectos") y fallaría si la
// base de datos todavía no existe en el momento del build (p.ej. en Railway,
// donde las migraciones se aplican en el Pre-deploy, después del build).
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const companyId = await getCompanyId();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  return <AppShell companyName={company?.name ?? "Mi empresa"}>{children}</AppShell>;
}
