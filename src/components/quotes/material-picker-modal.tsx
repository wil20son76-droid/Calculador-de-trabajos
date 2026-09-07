"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatMoney, unitLabel } from "@/lib/utils/format";
import { emptyMaterial, type MaterialDraft } from "@/lib/quotes/draft-types";

export interface MaterialOption {
  id: string;
  name: string;
  unit: MaterialDraft["unit"];
  purchasePrice: number;
  marginPercent: number;
  calcType: MaterialDraft["calcType"];
  coveragePerUnit: number | null;
  coatsDefault: number | null;
  wastePercentDefault: number;
  packageSize: number | null;
  containerSizes: number[] | null;
}

export function MaterialPickerModal({
  open,
  onClose,
  options,
  defaultMargin,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  options: MaterialOption[];
  defaultMargin: number;
  onSelect: (material: MaterialDraft) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  function pick(option: MaterialOption) {
    onSelect({
      ...emptyMaterial(),
      materialLibraryItemId: option.id,
      name: option.name,
      quantity: 1,
      unit: option.unit,
      purchasePrice: option.purchasePrice,
      marginPercent: option.marginPercent,
      calcType: option.calcType,
      coveragePerUnit: option.coveragePerUnit,
      coats: option.coatsDefault,
      wastePercent: option.wastePercentDefault,
      packageSize: option.packageSize,
      containerSizes: option.containerSizes,
    });
    onClose();
    setSearch("");
  }

  function pickBlank() {
    onSelect({ ...emptyMaterial(), marginPercent: defaultMargin });
    onClose();
    setSearch("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Agregar material — Lägg till material">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar material..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.map((option) => (
            <button
              key={option.id}
              onClick={() => pick(option)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50"
            >
              <p className="font-medium text-slate-800">{option.name}</p>
              <span className="text-sm font-medium text-slate-600">
                {formatMoney(option.purchasePrice)}/{unitLabel(option.unit)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">Sin resultados.</p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-3">
          <Button type="button" variant="outline" onClick={pickBlank} className="w-full">
            + Material personalizado (en blanco)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
