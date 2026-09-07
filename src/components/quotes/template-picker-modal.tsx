"use client";

import { Modal } from "@/components/ui/modal";
import { formatMoney } from "@/lib/utils/format";
import { emptyItem, type ItemDraft } from "@/lib/quotes/draft-types";

export interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  items: {
    name: string;
    descriptionClient: string | null;
    pricingMethod: ItemDraft["pricingMethod"];
    unit: ItemDraft["unit"];
    quantity: number;
    unitPrice: number;
  }[];
}

export function TemplatePickerModal({
  open,
  onClose,
  templates,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  templates: TemplateOption[];
  onSelect: (items: ItemDraft[]) => void;
}) {
  function pick(template: TemplateOption) {
    const items: ItemDraft[] = template.items.map((i) => ({
      ...emptyItem(),
      name: i.name,
      descriptionClient: i.descriptionClient,
      pricingMethod: i.pricingMethod,
      unit: i.unit,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    onSelect(items);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Usar plantilla">
      <div className="space-y-1">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => pick(t)}
            className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50"
          >
            <span className="font-medium text-slate-800">{t.name}</span>
            <span className="text-xs text-slate-400">
              {t.items.length} trabajos ·{" "}
              {formatMoney(t.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}
            </span>
          </button>
        ))}
        {templates.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-slate-400">
            No hay plantillas creadas todavía.
          </p>
        )}
      </div>
    </Modal>
  );
}
