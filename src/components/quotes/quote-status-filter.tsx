"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { QUOTE_STATUSES } from "@/lib/validation/quote";
import { quoteStatusLabel } from "@/lib/utils/format";

export function QuoteStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    >
      <option value="">Todos los estados</option>
      {QUOTE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {quoteStatusLabel(s)}
        </option>
      ))}
    </select>
  );
}
