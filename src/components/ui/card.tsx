import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
      {Icon && (
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      )}
    </Card>
  );
}
