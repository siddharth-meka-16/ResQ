"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLiveData } from "@/hooks/useLiveData";
import { Logo } from "@/components/ui/Logo";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export function Sidebar({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { connected } = useLiveData();
  const { dict } = useTranslation();

  const navGroups = [
    {
      title: dict.nav.operations,
      items: [
        { href: "/dashboard", label: dict.nav.overview, glyph: "O" },
        { href: "/dashboard/map", label: dict.nav.liveMap, glyph: "M" },
        { href: "/dashboard/incidents", label: dict.nav.incidents, glyph: "I" },
        { href: "/dashboard/assignments", label: dict.nav.assignments, glyph: "A" },
        { href: "/dashboard/replanning", label: "Route Replanning", glyph: "R" },
      ],
    },
    {
      title: dict.nav.resources,
      items: [
        { href: "/dashboard/resources", label: dict.nav.teams, glyph: "T" },
        { href: "/dashboard/shelters", label: dict.nav.shelters, glyph: "S" },
        { href: "/hospitals", label: "Hospital ICU Beds", glyph: "H" },
        { href: "/reunite", label: "Reunite (Missing Persons)", glyph: "Re" },
      ],
    },
    {
      title: dict.nav.tools,
      items: [
        { href: "/dashboard/analytics", label: "Historical Learning (AI)", glyph: "AI" },
        { href: "/dashboard/simulation", label: dict.nav.simulation, glyph: "Si" },
      ],
    },
  ];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-[var(--color-border)] bg-white transition-all lg:w-60">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[var(--color-border)] px-3 lg:px-5">
        <Logo size={40} />
        <div className="hidden min-w-0 lg:block">
          <div className="truncate text-sm font-bold leading-tight">
            {dict.common.appName}
          </div>
          <div className="text-xs text-muted">{dict.common.controlRoom}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto p-2 lg:p-3">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="mb-1 hidden px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 lg:block">
              {group.title}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={`group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors lg:px-3 ${
                        active
                          ? "bg-blue-50 text-[var(--color-accent)]"
                          : "text-muted hover:bg-gray-50 hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-accent)]" />
                      )}
                      <span
                        aria-hidden
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                          active
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                        }`}
                      >
                        {item.glyph}
                      </span>
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / language switcher + user card */}
      <div className="shrink-0 border-t border-[var(--color-border)] p-2 lg:p-4">
        {/* Language selector for desktop & mobile */}
        <div className="mb-3 hidden lg:block">
          <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {dict.common.language}
          </div>
          <LanguageSelector variant="pill" className="w-full justify-between" />
        </div>
        <div className="mb-2 flex justify-center lg:hidden">
          <LanguageSelector variant="compact" />
        </div>

        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] text-muted lg:hidden">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              connected ? "bg-green-500" : "bg-amber-400"
            }`}
          />
        </div>
        <div className="mb-2 hidden items-center gap-1.5 px-1 text-[11px] text-muted lg:flex">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              connected ? "bg-green-500" : "bg-amber-400"
            }`}
          />
          {connected ? dict.common.realtimeConnected : dict.common.reconnecting}
        </div>

        <div className="rounded-xl bg-gray-50 p-2 lg:p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
              {userName.slice(0, 2).toUpperCase()}
            </span>
            <div className="hidden min-w-0 flex-1 lg:block">
              <div className="truncate text-xs font-semibold">{userName}</div>
              <div className="truncate text-[10px] uppercase tracking-wide text-muted">
                {userRole.replace("_", " ")}
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            title={dict.common.signOut}
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white py-1.5 text-xs font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-600"
          >
            {dict.common.signOut}
          </button>
        </div>
      </div>
    </aside>
  );
}
