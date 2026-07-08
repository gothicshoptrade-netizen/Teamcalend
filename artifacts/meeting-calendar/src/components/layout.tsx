import * as React from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useHealthCheck } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { CalendarDays, Calendar, Plus, Users, Search, Activity, Menu, X } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Сегодня", icon: Calendar },
    { href: "/week", label: "Неделя", icon: CalendarDays },
    { href: "/search", label: "Все встречи", icon: Search },
    { href: "/employees", label: "Сотрудники", icon: Users },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-5 md:p-6">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 font-bold text-lg tracking-tight"
        >
          <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <span>Studio Sync</span>
        </Link>
        <div className="mt-6">
          <Link
            href="/new"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-4 rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Новая встреча
          </Link>
        </div>
      </div>

      <nav className="flex-1 px-3 md:px-4 py-2 space-y-0.5">
        <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-2 px-2">
          Разделы
        </div>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-black/5"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-2 px-2 py-2 rounded-md text-xs font-mono text-muted-foreground bg-black/5">
          <Activity className="h-3 w-3 shrink-0" />
          <span className="flex-1">Статус системы</span>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                health?.status === "ok" ? "bg-green-500" : "bg-destructive animate-pulse"
              )}
            />
            <span className="capitalize">{health?.status === "ok" ? "Ок" : "Проверка..."}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 border-r border-sidebar-border bg-sidebar flex flex-col transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-black/10"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden md:flex w-64 border-r border-sidebar-border bg-sidebar flex-col fixed inset-y-0 left-0 z-10">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-sidebar sticky top-0 z-10">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-black/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight">
            <div className="h-5 w-5 bg-primary rounded-sm flex items-center justify-center shrink-0">
              <Calendar className="h-3 w-3 text-white" />
            </div>
            Studio Sync
          </Link>
          <Link
            href="/new"
            className="ml-auto flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Создать
          </Link>
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
