"use client";

import { useState } from "react";
import { Copy, Check, FileOutput } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FortnoxCopyPanel({ swedish, spanish }: { swedish: string; spanish: string }) {
  const [copied, setCopied] = useState<"sv" | "es" | null>(null);

  async function copy(text: string, which: "sv" | "es") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Portapapeles no disponible (p.ej. sin HTTPS): no hacemos nada más,
      // el texto sigue visible para seleccionar y copiar a mano.
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <FileOutput className="h-4 w-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-slate-900">Copiar detalle para Fortnox</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-slate-400">Sueco (Fortnox)</span>
            <Button size="sm" variant="outline" onClick={() => copy(swedish, "sv")}>
              {copied === "sv" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "sv" ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <textarea
            readOnly
            value={swedish}
            rows={10}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-slate-400">
              Español (revisión interna)
            </span>
            <Button size="sm" variant="outline" onClick={() => copy(spanish, "es")}>
              {copied === "es" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "es" ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <textarea
            readOnly
            value={spanish}
            rows={10}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700"
          />
        </div>
      </div>
    </Card>
  );
}
