"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLiveData } from "@/hooks/useLiveData";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import type { Shelter, ShelterStock, StockItemType } from "@/types/database";
import { Logo } from "@/components/ui/Logo";
import { useTranslation } from "@/context/LanguageContext";

const STOCK_TYPES: StockItemType[] = [
  "FOOD", "WATER", "MEDICAL", "BLANKETS", "CLOTHING", "SANITATION", "TENTS", "OTHER",
];

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-green-50 text-green-700",
  FILLING: "bg-amber-50 text-amber-700",
  NEAR_CAPACITY: "bg-orange-50 text-orange-700",
  FULL: "bg-red-50 text-red-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200/70 ${className ?? ""}`} />
  );
}

export default function ShelterManagePage() {
  const { shelters, connected, initialLoading, refresh } = useLiveData();
  const { dict } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserName(user.user_metadata?.name ?? user.email?.split("@")[0] ?? "");
    })();
  }, []);

  const myShelters = useMemo(
    () => shelters.filter((s) => s.managed_by_id && s.managed_by_id === userId),
    [shelters, userId]
  );
  const claimable = useMemo(
    () => shelters.filter((s) => s.managed_by_id !== userId),
    [shelters, userId]
  );

  async function claimShelter(shelterId: string) {
    setBusyId(shelterId);
    setError(null);
    const { error } = await createClient()
      .from("shelters")
      .update({ managed_by_id: userId })
      .eq("id", shelterId);
    if (error) setError(error.message);
    await refresh();
    setBusyId(null);
  }

  async function unclaimShelter(shelterId: string) {
    setBusyId(shelterId);
    setError(null);
    const { error } = await createClient()
      .from("shelters")
      .update({ managed_by_id: null })
      .eq("id", shelterId);
    if (error) setError(error.message);
    await refresh();
    setBusyId(null);
  }

  const totals = useMemo(() => {
    const cap = myShelters.reduce((n, s) => n + s.total_capacity, 0);
    const occ = myShelters.reduce((n, s) => n + s.current_occupancy, 0);
    return { cap, occ, pct: cap > 0 ? Math.round((occ / cap) * 100): 0 };
  }, [myShelters]);

  async function adjustOccupancy(shelter: Shelter, delta: number) {
    setBusyId(shelter.id);
    setError(null);
    const next = Math.max(
      0,
      Math.min(shelter.total_capacity, shelter.current_occupancy + delta)
    );
    const { error } = await createClient()
.from("shelters")
.update({ current_occupancy: next })
.eq("id", shelter.id);
    if (error) setError(error.message);
    await refresh();
    setBusyId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={48} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-tight">
                {dict.shelterManage.title}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    connected ? "bg-green-500": "bg-amber-400"
                  }`}
                />
                <span className="truncate">
                  {!connected ? dict.shelterManage.reconnecting : userName || dict.shelterManage.reliefOperations}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SignOutButton
              label={dict.common.signOut}
              className="shrink-0 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-gray-50 hover:text-foreground disabled:opacity-60 sm:text-sm"
            />
            <LanguageSelector variant="compact" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
        {error && (
          <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-[var(--color-primary)]">
            {error}
          </p>
        )}

        {/* Summary */}
        <section
          className="mb-7 grid grid-cols-3 gap-3"
          aria-label="Occupancy summary"
        >
          {initialLoading ? (
            [0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-[76px] rounded-2xl" />
            ))
          ): (
            <>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {dict.shelterManage.summary.sheltersManaged}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {myShelters.length}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {dict.shelterManage.summary.peopleSheltered}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {totals.occ}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {dict.shelterManage.summary.totalCapacityUsed}
                </div>
                <div className={`mt-1 text-2xl font-bold tabular-nums ${totals.pct >= 90 ? "text-red-600": totals.pct >= 50 ? "text-amber-600": "text-green-600"}`}>
                  {totals.pct}%
                </div>
              </div>
            </>
          )}
        </section>

        {/* Claim flow */}
        {!initialLoading && claimable.length > 0 && (
          <section className="mb-7" aria-label={dict.shelterManage.claimYourShelter}>
            <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-muted">
              {dict.shelterManage.claimYourShelter} ({claimable.length} Available)
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {claimable.map((s) => (
                <button
                  key={s.id}
                  disabled={busyId === s.id}
                  onClick={() => claimShelter(s.id)}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-[0.99] cursor-pointer"
                >
                  <span className="min-w-0">
                    <b className="block truncate"> {s.name}</b>
                    <span className="text-xs text-muted">{s.address}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[var(--color-accent)]">
                    {dict.shelterManage.claim} →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Shelters */}
        {initialLoading ? (
          <ul className="space-y-3">
            {[0, 1].map((n) => (
              <Skeleton key={n} className="h-48 rounded-2xl" />
            ))}
          </ul>
        ) : myShelters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center">
            <div className="text-3xl">🏠</div>
            <p className="mt-2 text-sm font-medium">{dict.shelterManage.noSheltersAssigned}</p>
            <p className="mt-1 text-xs text-muted">
              {dict.shelterManage.askOperator}
            </p>
          </div>
        ) : (
          <ul className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {myShelters.map((s) => (
              <li key={s.id}>
                <ShelterCard
                  shelter={s}
                  busy={busyId === s.id}
                  onAdjust={(d) => adjustOccupancy(s, d)}
                  onRefresh={refresh}
                  onUnclaim={() => unclaimShelter(s.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function ShelterCard({
  shelter,
  busy,
  onAdjust,
  onRefresh,
  onUnclaim,
}: {
  shelter: Shelter;
  busy: boolean;
  onAdjust: (delta: number) => void;
  onRefresh: () => void;
  onUnclaim?: () => void;
}) {
  const { dict } = useTranslation();
  const pct = Math.min(
    100,
    Math.round((shelter.current_occupancy / shelter.total_capacity) * 100)
  );
  const barColor =
    pct >= 90 ? "#dc2626" : pct >= 50 ? "#d97706" : "#16a34a";
  const closed = shelter.status === "CLOSED";

  const statusLabels = dict.shelterManage.occupancyStatus;
  const statusLabel = closed
    ? statusLabels.closed
    : shelter.status === "NEAR_CAPACITY"
      ? statusLabels.nearCapacity
      : shelter.status === "FILLING"
        ? statusLabels.filling
        : shelter.status === "FULL"
          ? statusLabels.full
          : statusLabels.open;

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{shelter.name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted">{shelter.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              STATUS_STYLES[shelter.status] ?? STATUS_STYLES.OPEN
            }`}
          >
            {statusLabel}
          </span>
          {onUnclaim && (
            <button
              disabled={busy}
              onClick={onUnclaim}
              className="text-[11px] text-gray-400 hover:text-red-600 transition-colors cursor-pointer px-1.5 py-0.5 rounded border border-gray-200"
              title="Release / Unclaim shelter"
            >
              Release
            </button>
          )}
        </div>
      </div>

      {/* Occupancy */}
      <div className="mt-4 flex items-end justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {dict.shelterManage.occupancy}
        </span>
        <span className="text-lg font-bold tabular-nums">
          {shelter.current_occupancy}
          <span className="text-sm font-medium text-muted">
            /{shelter.total_capacity}
          </span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${closed ? 0: pct}%`, background: barColor }}
        />
      </div>

      {/* Controls */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <button
          disabled={busy || closed || shelter.current_occupancy === 0}
          onClick={() => onAdjust(-5)}
          className="h-10 rounded-lg border border-[var(--color-border)] text-sm font-semibold transition-colors hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40"
        >
          {dict.shelterManage.controls.minus5}
        </button>
        <button
          disabled={busy || closed}
          onClick={() => onAdjust(1)}
          className="h-10 rounded-lg border border-[var(--color-border)] text-sm font-semibold transition-colors hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40"
        >
          {dict.shelterManage.controls.plus1}
        </button>
        <button
          disabled={busy || closed}
          onClick={() => onAdjust(5)}
          className="h-10 rounded-lg border border-[var(--color-border)] text-sm font-semibold transition-colors hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40"
        >
          {dict.shelterManage.controls.plus5}
        </button>
        <button
          disabled={busy || closed || shelter.current_occupancy + 10 > shelter.total_capacity}
          onClick={() => onAdjust(10)}
          className="h-10 rounded-lg border border-[var(--color-border)] text-sm font-semibold transition-colors hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40"
        >
          {dict.shelterManage.controls.plus10}
        </button>
      </div>

      {shelter.contact_phone && (
        <a
          href={`tel:${shelter.contact_phone}`}
          className="mt-3 inline-block text-xs font-medium text-[var(--color-accent)]"
        >
           {shelter.contact_phone}
        </a>
      )}

      {!closed && <StockEditor shelterId={shelter.id} onSaved={onRefresh} />}
    </article>
  );
}

function StockEditor({
  shelterId,
  onSaved,
}: {
  shelterId: string;
  onSaved: () => void;
}) {
  const { dict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<ShelterStock[] | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await createClient()
.from("shelter_stocks")
.select("*")
.eq("shelter_id", shelterId)
.order("item_type");
    setStocks(data ?? []);
  }, [shelterId]);

  useEffect(() => {
    if (!open || stocks !== null) return;
    void (async () => {
      await load();
    })();
  }, [open, stocks, load]);

  async function adjust(item: ShelterStock | null, itemType: StockItemType, delta: number) {
    setBusyItem(itemType);
    const supabase = createClient();
    const qty = item?.quantity ?? 0;
    const max = Math.max(item?.max_quantity ?? 100, qty + delta, 100);
    const next = Math.max(0, Math.min(max, qty + delta));

    if (item) {
      await supabase
.from("shelter_stocks")
.update({ quantity: next, last_updated: new Date().toISOString() })
.eq("id", item.id);
    } else {
      await supabase.from("shelter_stocks").upsert({
        shelter_id: shelterId,
        item_type: itemType,
        quantity: next,
        max_quantity: max,
        last_updated: new Date().toISOString(),
      }, { onConflict: "shelter_id,item_type" });
    }
    await load();
    setBusyItem(null);
    onSaved();
  }

  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-3">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-foreground"
      >
         {dict.shelterManage.suppliesInventory}
        <span>{open ? "▴": "▾"}</span>
      </button>

{open && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stocks === null
            ? [0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-16" />)
          : STOCK_TYPES.map((value) => {
              const label = dict.shelterManage.stockItems[value];
              const item = stocks.find((s) => s.item_type === value) ?? null;
              const qty = item?.quantity ?? 0;
              const max = item?.max_quantity ?? 100;
              const low = qty <= max * 0.25;
              return (
                <div
                  key={value}
                  className={`rounded-lg border p-2 ${
                    low ? "border-red-200 bg-red-50/60": "border-[var(--color-border)] bg-gray-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      {label}
                    </span>
                    <span className={`font-bold tabular-nums ${low ? "text-red-600": ""}`}>
                      {qty}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <button
                      disabled={busyItem === value || qty === 0}
                      onClick={() => adjust(item, value, -10)}
                      className="h-6 w-7 rounded border border-[var(--color-border)] bg-white text-xs transition-colors hover:bg-gray-100 disabled:opacity-40"
                      aria-label={dict.shelterManage.decrease}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      defaultValue={qty}
                      key={`${value}-${qty}`}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v !== qty) adjust(item, value, v - qty);
                      }}
                      className="h-6 w-12 rounded border border-[var(--color-border)] bg-white text-center text-xs tabular-nums focus:outline-2 focus:outline-[var(--color-accent)]"
                      aria-label={`${label} quantity`}
                    />
                    <button
                      disabled={busyItem === value}
                      onClick={() => adjust(item, value, 10)}
                      className="h-6 w-7 rounded border border-[var(--color-border)] bg-white text-xs transition-colors hover:bg-gray-100 disabled:opacity-40"
                      aria-label={dict.shelterManage.increase}
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-1 text-[9px] text-muted">{dict.shelterManage.ofCapacity.replace("{max}", String(max))}</div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
