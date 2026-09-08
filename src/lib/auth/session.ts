import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { AUTH_ENABLED } from "@/lib/config";

export class UnauthorizedError extends Error {
  constructor() {
    super("No autorizado");
    this.name = "UnauthorizedError";
  }
}

/** Obtiene la sesión actual o lanza UnauthorizedError. Úsalo en route handlers y server actions. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new UnauthorizedError();
  }
  return session;
}

let cachedSingleCompanyId: string | null = null;

/**
 * Devuelve el id de la empresa activa. Mientras AUTH_ENABLED sea false (herramienta
 * interna de un único usuario, sin login) usa directamente la única empresa de la
 * base de datos en vez de exigir sesión — así se puede reactivar el login más
 * adelante sin tocar el resto de rutas/páginas, que solo llaman a esta función.
 */
export async function getCompanyId(): Promise<string> {
  if (AUTH_ENABLED) {
    const session = await requireSession();
    return session.user.companyId;
  }
  if (cachedSingleCompanyId) return cachedSingleCompanyId;
  const company = await prisma.company.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
  cachedSingleCompanyId = company.id;
  return company.id;
}
