/**
 * Interruptor global de autenticación. Por ahora la app es una herramienta interna
 * de un único usuario/empresa (sin login): se usa la primera empresa de la base de
 * datos en vez de una sesión. El código de NextAuth (auth.ts, proxy.ts, la tabla
 * User) se mantiene intacto para poder reactivar el login más adelante — basta con
 * volver a poner esto en `true`.
 */
export const AUTH_ENABLED = false;
