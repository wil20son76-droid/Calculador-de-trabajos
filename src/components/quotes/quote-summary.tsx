import type { CalcQuoteResult } from "@/lib/calc/types";
import type { CategorySummaryGroup } from "@/lib/calc/category-summary";
import { formatMoney, formatNumber } from "@/lib/utils/format";
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
  categoryGroups,
  materialCategoryGroups,
  currency,
  totalHours,
  effectiveHourlyRate,
  showInternal,
}: {
  result: CalcQuoteResult;
  categoryGroups: CategorySummaryGroup[];
  materialCategoryGroups: CategorySummaryGroup[];
  currency: string;
  totalHours: number;
  effectiveHourlyRate: number;
  showInternal: boolean;
}) {
  const money = (v: number) => formatMoney(v, currency);
  const hasDeduction = result.rotDeduction > 0 || result.rutDeduction > 0;

  return (
    <div className="space-y-4">
      {categoryGroups.length > 1 && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Resumen por categoría</h3>
          <div className="divide-y divide-slate-50 text-sm">
            {categoryGroups.map((group) => (
              <div key={group.categoryName} className="py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{group.categoryName}</span>
                  <span className="font-semibold text-slate-900">{money(group.subtotal)}</span>
                </div>
                <div className="mt-0.5 space-y-0.5 pl-2 text-xs text-slate-400">
                  {group.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between">
                      <span>{line.name || "Trabajo"}</span>
                      <span>{money(line.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {materialCategoryGroups.length > 0 && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Materiales</h3>
          <div className="divide-y divide-slate-50 text-sm">
            {materialCategoryGroups.map((group) => (
              <Row
                key={group.categoryName}
                label={`Materiales de ${group.categoryName.toLowerCase()}`}
                value={money(group.subtotal)}
              />
            ))}
          </div>
          <div className="my-2 border-t border-slate-200" />
          <Row label="Total material" value={money(result.materialAfterDiscount)} bold />
        </Card>
      )}

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Resumen</h3>
        <div className="divide-y divide-slate-50 text-sm">
          <Row label="Arbete (mano de obra)" value={money(result.laborAfterDiscount)} />
          <Row label="Material" value={money(result.materialAfterDiscount)} />
          <Row label="Övrigt (otros costes)" value={money(result.otherAfterDiscount)} />
        </div>
        <div className="my-2 border-t border-slate-100" />
        <div className="text-sm">
          {result.globalDiscountAmount > 0 && (
            <Row label="Rabatt (descuento)" value={`-${money(result.globalDiscountAmount)}`} />
          )}
          <Row label="Delsumma (subtotal)" value={money(result.subtotalAfterDiscount)} bold />
          <Row label="Moms" value={money(result.vatAmount)} />
          <Row label="Totalt före avdrag" value={money(result.totalInclVat)} bold />
          {result.rotDeduction > 0 && (
            <>
              <Row label="ROT-underlag" value={money(result.rotEligibleLaborBase)} muted />
              <Row label="ROT-avdrag" value={`-${money(result.rotDeduction)}`} negative />
            </>
          )}
          {result.rutDeduction > 0 && (
            <>
              <Row label="RUT-underlag" value={money(result.rutEligibleLaborBase)} muted />
              <Row label="RUT-avdrag" value={`-${money(result.rutDeduction)}`} negative />
            </>
          )}
        </div>
        <div className="my-2 border-t border-slate-200" />
        <Row
          label={hasDeduction ? "Att betala efter avdrag" : "Att betala"}
          value={money(result.totalDue)}
          bold
        />
      </Card>

      {showInternal && (
        <Card className="border-amber-200 bg-amber-50/50">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-amber-900">Resumen interno</h3>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-800">
              nunca visible al cliente
            </span>
          </div>
          <div className="text-sm">
            <Row label="Venta trabajo + material" value={money(result.subtotalAfterDiscount)} muted />
            <Row label="Coste mano de obra" value={money(result.laborCostInternal)} muted />
            <Row label="Coste materiales" value={money(result.materialCostInternal)} muted />
            <Row label="Otros costes" value={money(result.otherAfterDiscount)} muted />
          </div>
          <div className="my-2 border-t border-amber-200" />
          <div className="text-sm">
            <Row label="Coste total" value={money(result.totalCostInternal)} muted />
            <Row label="Beneficio bruto" value={money(result.grossProfit)} muted />
            <Row label="Margen" value={`${result.marginPercent.toFixed(1)}%`} muted />
          </div>
          <div className="my-2 border-t border-amber-200" />
          <div className="text-sm">
            <Row label="Horas totales" value={`${formatNumber(totalHours, 1)} h`} muted />
            <Row
              label="Precio efectivo/hora"
              value={totalHours > 0 ? money(effectiveHourlyRate) : "—"}
              muted
            />
          </div>
        </Card>
      )}
    </div>
  );
}
