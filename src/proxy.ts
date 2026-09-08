import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { AUTH_ENABLED } from "@/lib/config";

const PUBLIC_PATHS = ["/login"];

const authProxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublic = PUBLIC_PATHS.some((path) => nextUrl.pathname.startsWith(path));

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

// Sin login por el momento (herramienta interna de un único usuario): la app abre
// directamente en Inicio. El proxy de NextAuth (authProxy, arriba) se mantiene
// intacto y listo para reactivarse — basta con poner AUTH_ENABLED en true.
export default function proxy(...args: Parameters<typeof authProxy>) {
  if (!AUTH_ENABLED) return NextResponse.next();
  return authProxy(...args);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
