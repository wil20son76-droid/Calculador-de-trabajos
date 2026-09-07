import { auth } from "@/lib/auth/auth";

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
