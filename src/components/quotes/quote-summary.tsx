import type { CalcQuoteResult } from "@/lib/calc/types";
import { formatMoney } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";

function Row({
  label,
  value,
  bold,
  muted,
  negative,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={muted ? "text-slate-400" : "text-slate-600"}>{label}</span>
      <span
        className={
          bold
            ? "text-base font-semibold text-slate-900"
            : negative
              ? "font-medium text-emerald-600"
              : "font-medium text-slate-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function QuoteSummary({
  result,
  rotEnabled,
  currency,
  showInternal,
}: {
  result: CalcQuoteResult;
  rotEnabled: boolean;
  currency: string;
  showInternal: boolean;
}) {
  const money = (v: number) => formatMoney(v, currency);

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Resumen</h3>
        <div className="divide-y divide-slate-50 text-sm">
          <Row label="Mano de obra" value={money(result.laborAfterDiscount)} />
          <Row label="Materiales" value={money(result.materialAfterDiscount)} />
          <Row label="Otros costes" value={money(result.otherAfterDiscount)} />
        </div>
        <div className="my-2 border-t border-slate-100" />
        <div className="text-sm">
          {result.globalDiscountAmount > 0 && (
            <Row label="Descuento" value={`-${money(result.globalDiscountAmount)}`} />
          )}
          <Row label="Subtotal" value={money(result.subtotalAfterDiscount)} bold />
          <Row label="Moms / IVA" value={money(result.vatAmount)} />
          <Row label="Total" value={money(result.totalInclVat)} bold />
          {rotEnabled && (
            <Row
              label="ROT-avdrag"
              value={`-${money(result.rotDeduction)}`}
              negative
            />
          )}
        </div>
        <div className="my-2 border-t border-slate-200" />
        <Row label="TOTAL A PAGAR" value={money(result.totalDue)} bold />
      </Card>

      {showInternal && (
        <Card className="border-amber-200 bg-amber-50/50">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-amber-900">Solo interno</h3>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-800">
              nunca visible al cliente
            </span>
          </div>
          <div className="text-sm">
            <Row label="Venta" value={money(result.subtotalAfterDiscount)} muted />
            <Row label="Coste mano de obra" value={money(result.laborCostInternal)} muted />
            <Row label="Coste materiales" value={money(result.materialCostInternal)} muted />
            <Row label="Otros costes" value={money(result.otherAfterDiscount)} muted />
          </div>
          <div className="my-2 border-t border-amber-200" />
          <div className="text-sm">
            <Row label="Coste total empresa" value={money(result.totalCostInternal)} muted />
            <Row label="Beneficio bruto" value={money(result.grossProfit)} muted />
            <Row label="Margen" value={`${result.marginPercent.toFixed(1)}%`} muted />
          </div>
        </Card>
      )}
    </div>
  );
}
