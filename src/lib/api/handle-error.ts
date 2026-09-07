import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { UnauthorizedError } from "@/lib/auth/session";

/** Traduce errores comunes de la capa de dominio a respuestas HTTP consistentes. */
export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: error.issues },
      { status: 400 }
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}
