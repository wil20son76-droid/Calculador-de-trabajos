/** Convierte texto libre en un slug apto para nombre de archivo (sección 5 de la spec). */
function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Nombre de archivo del PDF: "Johamar-Bygg-[nombre-proyecto]-[fecha].pdf".
 * El prefijo se deriva del nombre de la empresa (quitando el sufijo "AB").
 */
export function buildPdfFilename(companyName: string, projectName: string | null, date: Date): string {
  const companySlug = slugify(companyName.replace(/\s+AB\.?$/i, ""));
  const projectSlug = slugify(projectName || "presupuesto");
  const dateSlug = date.toISOString().slice(0, 10);
  return `${companySlug}-${projectSlug}-${dateSlug}.pdf`;
}
