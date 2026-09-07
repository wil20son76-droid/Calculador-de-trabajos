"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatMoney, pricingMethodLabel, unitLabel } from "@/lib/utils/format";
import { emptyItem, type ItemDraft } from "@/lib/quotes/draft-types";

export interface PriceListOption {
  id: string;
  name: string;
  categoryName: string | null;
  pricingMethod: ItemDraft["pricingMethod"];
  unit: ItemDraft["unit"];
  defaultUnitPrice: number;
  defaultHourlyRate: number | null;
}

export function JobPickerModal({
  open,
  onClose,
  options,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  options: PriceListOption[];
  onSelect: (item: ItemDraft) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  function pick(option: PriceListOption) {
    const item: ItemDraft = {
      ...emptyItem(),
      priceListItemId: option.id,
      categoryName: option.categoryName,
      name: option.name,
      pricingMethod: option.pricingMethod,
      unit: option.unit,
      quantity: 1,
      unitPrice: option.defaultUnitPrice,
    };
    onSelect(item);
    onClose();
    setSearch("");
  }

  function pickBlank() {
    onSelect(emptyItem());
    onClose();
    setSearch("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Agregar trabajo — Lägg till arbete">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar trabajo en la lista de precios..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {filtered.map((option) => (
            <button
              key={option.id}
              onClick={() => pick(option)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-800">{option.name}</p>
                <p className="text-xs text-slate-400">
                  {option.categoryName ?? "Sin categoría"} · {pricingMethodLabel(option.pricingMethod)}
                </p>
              </div>
              <span className="text-sm font-medium text-slate-600">
                {formatMoney(option.defaultUnitPrice)}/{unitLabel(option.unit)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">Sin resultados.</p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-3">
          <Button type="button" variant="outline" onClick={pickBlank} className="w-full">
            + Trabajo personalizado (en blanco)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
