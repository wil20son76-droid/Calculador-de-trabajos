"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Sidebar } from "./sidebar";

export function AppShell({
  companyName,
  children,
}: {
  companyName: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        companyName={companyName}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900">{companyName}</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
