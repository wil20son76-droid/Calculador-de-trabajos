"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Folder,
  Tag,
  Package,
  Layers,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proyectos", label: "Proyectos", icon: Folder },
  { href: "/precios", label: "Lista de precios", icon: Tag },
  { href: "/materiales", label: "Materiales", icon: Package },
  { href: "/plantillas", label: "Plantillas", icon: Layers },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar({
  companyName,
  userName,
  open,
  onClose,
}: {
  companyName: string;
  userName: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              O
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-900">
                {companyName}
              </p>
              <p className="text-xs text-slate-400">Offert & Kalkyl</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-3 py-3">
          <div className="mb-2 truncate px-3 text-xs text-slate-400">{userName}</div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-red-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
