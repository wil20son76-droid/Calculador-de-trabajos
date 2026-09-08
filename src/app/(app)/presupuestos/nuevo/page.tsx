import { NewQuoteForm } from "@/components/quotes/new-quote-form";

const QUICK_CATEGORIES = [
  "Pintura interior",
  "Pintura exterior",
  "Suelos",
  "Cocina",
  "Baño",
  "Carpintería",
  "Reforma general",
];

export default async function NewQuotePage({
  searchParams,
}: PageProps<"/presupuestos/nuevo">) {
  const params = await searchParams;
  const categoria = typeof params.categoria === "string" ? params.categoria : "";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Nuevo cálculo</h1>
        <p className="text-sm text-slate-500">
          Datos básicos del trabajo. No hace falta cliente: eso se gestiona en Fortnox.
        </p>
      </div>
      <NewQuoteForm categories={QUICK_CATEGORIES} initialCategory={categoria} />
    </div>
  );
}
