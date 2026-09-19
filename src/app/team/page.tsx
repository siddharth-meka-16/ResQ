"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLiveData, isActiveAssignment } from "@/hooks/useLiveData";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { Logo } from "@/components/ui/Logo";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { useTranslation } from "@/context/LanguageContext";
import type {
  Assignment,
  ResourceStatus,
  ResourceTeam,
  UserRole,
} from "@/types/database";

const STEPS = ["PENDING", "ACKNOWLEDGED", "EN_ROUTE", "ON_SCENE"] as const;

const STATUS_DOTS: Record<string, string> = {
  AVAILABLE: "bg-green-500",
  ASSIGNED: "bg-blue-500",
  EN_ROUTE: "bg-blue-500",
  ON_SCENE: "bg-purple-500",
  RETURNING: "bg-cyan-500",
  UNAVAILABLE: "bg-gray-400",
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200/70 ${className ?? ""}`} />
  );
}

export default function TeamPage() {
  const { teams, incidents, assignments, connected, initialLoading, refresh } =
    useLiveData();
  const { dict } = useTranslation();
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatic = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setUserName(
      user.user_metadata?.name ?? user.email?.split("@")[0] ?? ""
    );

    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
.from("assignments")
.select("id", { count: "exact", head: true })
.eq("status", "COMPLETED"),
    ]);
    setRole(profile?.role ?? null);
    setCompletedCount(count ?? 0);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadStatic();
    })();
  }, [loadStatic]);

  // Derived from realtime stores
  const myTeams = useMemo(
    () => teams.filter((t) => t.managed_by_id && t.managed_by_id === userId),
    [teams, userId]
  );
  const claimable = useMemo(
    () => teams.filter((t) => t.managed_by_id !== userId),
    [teams, userId]
  );
  const teamIds = useMemo(() => new Set(myTeams.map((t) => t.id)), [myTeams]);
  const missions = useMemo(
    () =>
      assignments.filter(
        (a) =>
          (teamIds.has(a.resource_id) || (a.team_id && teamIds.has(a.team_id))) &&
          isActiveAssignment(a)
      ),
    [assignments, teamIds]
  );
  const incidentById = useMemo(
    () => new Map(incidents.map((i) => [i.id, i])),
    [incidents]
  );
  const peopleHelped = useMemo(
    () =>
      missions.reduce((sum, a) => {
        const inc = incidentById.get(a.incident_id);
        return sum + (inc?.people_affected ?? 0);
      }, 0),
    [missions, incidentById]
  );

  async function claimTeam(teamId: string) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("resource_teams")
      .update({ managed_by_id: userId })
      .eq("id", teamId);
    if (error) setError(error.message);
    await Promise.all([loadStatic(), refresh()]);
    setBusy(false);
  }

  async function unclaimTeam(teamId: string) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("resource_teams")
      .update({ managed_by_id: null })
      .eq("id", teamId);
    if (error) setError(error.message);
    await Promise.all([loadStatic(), refresh()]);
    setBusy(false);
  }

  async function setStatus(teamId: string, status: string) {
    setBusy(true);
    setError(null);
    const { error } = await createClient()
.from("resource_teams")
.update({
        status: status as ResourceStatus,
        last_status_update: new Date().toISOString(),
      })
.eq("id", teamId);
    if (error) setError(error.message);
    else void refresh();
    setBusy(false);
  }

  async function advanceAssignment(a: Assignment) {
    const actionLabels = dict.team.actionLabels;
    const actionMap: Record<string, { next: string; label: string } | undefined> = {
      PENDING: { next: "ACKNOWLEDGED", label: actionLabels.Acknowledge },
      ACKNOWLEDGED: { next: "EN_ROUTE", label: actionLabels["En Route"] },
      EN_ROUTE: { next: "ON_SCENE", label: actionLabels["On Scene"] },
      ON_SCENE: { next: "COMPLETED", label: actionLabels.Resolve },
    };
    const action = actionMap[a.status];
    if (!action) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/assignments/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      void refresh();
      if (action.next === "COMPLETED") void loadStatic();
    } catch (e) {
      setError(e instanceof Error ? e.message: "Update failed");
    }
    setBusy(false);
  }

  async function escalate(incidentId: string) {
    setBusy(true);
    await createClient()
.from("incidents")
.update({ status: "ESCALATED" })
.eq("id", incidentId);
    void refresh();
    setBusy(false);
  }

  function getAction(status: string) {
    const actionLabels = dict.team.actionLabels;
    const actionMap: Record<string, { next: string; label: string } | undefined> = {
      PENDING: { next: "ACKNOWLEDGED", label: actionLabels.Acknowledge },
      ACKNOWLEDGED: { next: "EN_ROUTE", label: actionLabels["En Route"] },
      EN_ROUTE: { next: "ON_SCENE", label: actionLabels["On Scene"] },
      ON_SCENE: { next: "COMPLETED", label: actionLabels.Resolve },
    };
    return actionMap[status];
  }

  const wrongRole =
    role !== null && !["FIELD_TEAM", "OPERATOR", "ADMIN"].includes(role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={48} />
<div className="min-w-0">
              <div className="truncate text-sm font-bold leading-tight">
                {dict.team.title}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    connected ? "bg-green-500": "bg-amber-400"
                  }`}
                />
                <span className="truncate">
                  {!connected
                    ? dict.team.reconnecting
                    : userName || dict.team.rescueOperations}
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
        {wrongRole && (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            {dict.team.wrongRole.replace("{role}", role!)}
          </p>
        )}

        {error && (
          <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-[var(--color-primary)]">
            {error}
          </p>
        )}

        {/* Stats strip */}
        <section className="mb-7 grid grid-cols-3 gap-3" aria-label="Summary">
          {initialLoading ? (
            [0, 1, 2].map((n) => <Skeleton key={n} className="h-[76px] rounded-2xl" />)
          ): (
            <>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {dict.team.activeMissions}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {missions.length}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {dict.team.peopleWaiting}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {peopleHelped}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {dict.team.resolvedAllTeams}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {completedCount ?? "—"}
                </div>
              </div>
            </>
          )}
        </section>

        {/* My teams */}
        {initialLoading ? (
          <Skeleton className="mb-7 h-28 rounded-2xl" />
        ): myTeams.length > 0 ? (
          <section className="mb-7" aria-label={dict.team.myTeams}>
            <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-muted">
              {dict.team.myTeams}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {myTeams.map((t: ResourceTeam) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                          STATUS_DOTS[t.status] ?? "bg-gray-400"
                        }`}
                      />
                      <b className="truncate">{t.team_code}</b>
                      <span className="truncate text-xs text-muted">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                        {t.status.replace(/_/g, " ")}
                      </span>
                      <button
                        disabled={busy}
                        onClick={() => unclaimTeam(t.id)}
                        className="text-[11px] text-gray-400 hover:text-red-600 transition-colors cursor-pointer px-1.5 py-0.5 rounded border border-gray-200"
                        title="Release / Unclaim squad"
                      >
                        Release
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 truncate text-xs text-muted">
                    {t.capabilities.join(" · ") || "general"} · cap {t.capacity}
                  </div>
                  {t.status === "RETURNING" && (
                    <button
                      disabled={busy}
                      onClick={() => setStatus(t.id, "AVAILABLE")}
                      className="mt-3 h-10 w-full rounded-lg border border-cyan-300 bg-cyan-50 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 active:scale-[0.99]"
                    >
                      {dict.team.confirmReturned}
                    </button>
                  )}
                  {["AVAILABLE", "UNAVAILABLE"].includes(t.status) && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        setStatus(t.id, t.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE")
                      }
                      className={`mt-3 h-10 w-full rounded-lg border text-xs font-semibold transition-colors active:scale-[0.99] ${
                        t.status === "AVAILABLE"
                          ? "border-gray-300 hover:bg-gray-50"
                          : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {t.status === "AVAILABLE" ? dict.team.goOffDuty : dict.team.reportOnDuty}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Claim flow */}
        {!initialLoading && claimable.length > 0 && (
          <section className="mb-7" aria-label={dict.team.claimYourTeam}>
            <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-muted">
              {dict.team.claimYourTeam} ({claimable.length} Available)
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {claimable.map((t) => (
                <button
                  key={t.id}
                  disabled={busy}
                  onClick={() => claimTeam(t.id)}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-[0.99] cursor-pointer"
                >
                  <span className="min-w-0">
                    <b>{t.team_code}</b>{" "}
                    <span className="text-xs text-muted">· {t.name}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[var(--color-accent)]">
                    {dict.team.claim} →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {!initialLoading && myTeams.length === 0 && claimable.length === 0 && (
          <div className="mb-7 rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center">
            <div className="text-3xl">🛡️</div>
            <p className="mt-2 text-sm font-medium">{dict.team.noTeamLinked}</p>
            <p className="mt-1 text-xs text-muted">
              {dict.team.askOperator}
            </p>
          </div>
        )}

        {/* Active missions */}
        <section aria-label="Active missions">
          <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-muted">
            Active Missions{" "}
            {missions.length > 0 && (
              <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                {missions.length} live
              </span>
            )}
          </h2>

          {initialLoading ? (
            <Skeleton className="h-56 rounded-2xl" />
          ): missions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center">
              <div className="text-3xl"></div>
              <p className="mt-2 text-sm font-medium">{dict.team.onStandby}</p>
              <p className="mt-1 text-xs text-muted">
                {dict.team.standbyDesc}
              </p>
            </div>
          ): (
            <ul className="space-y-4">
              {missions.map((a) => {
                const inc = incidentById.get(a.incident_id);
                const team = teams.find((t) => t.id === a.resource_id);
                const stepIdx = STEPS.indexOf(a.status as (typeof STEPS)[number]);
                const stepLabels = dict.team.stepLabels;
                return (
                  <li
                    key={a.id}
                    className="overflow-hidden rounded-2xl border-2 border-[var(--color-accent)] bg-white shadow-md"
                  >
                    {/* Stepper */}
                    <div className="flex items-center justify-between gap-1 border-b border-blue-100 bg-blue-50/60 px-4 py-3">
                      {STEPS.map((s, idx) => {
                        const done = stepIdx > idx;
                        const current = stepIdx === idx;
                        return (
                          <div key={s} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                            <div className="flex w-full items-center">
                              <span
                                className={`h-1 flex-1 rounded-full ${
                                  idx === 0 ? "opacity-0": done || current ? "bg-[var(--color-accent)]": "bg-gray-200"
                                }`}
                              />
                              <span
                                className={`mx-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                  current
                                    ? "bg-[var(--color-accent)] text-white ring-4 ring-blue-100"
: done
                                      ? "bg-[var(--color-accent)]/70 text-white"
: "bg-gray-200 text-gray-400"
                                }`}
                              >
                                {done ? "✓": idx + 1}
                              </span>
                              <span
                                className={`h-1 flex-1 rounded-full ${
                                  idx === STEPS.length - 1 ? "opacity-0": done ? "bg-[var(--color-accent)]": "bg-gray-200"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-medium ${
                                current ? "text-[var(--color-accent)]": "text-muted"
                              }`}
                            >
                              {stepLabels[s as keyof typeof stepLabels]}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-2">
                        {a.status === "PENDING" && (
                          <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                             {dict.team.newDispatch}
                          </span>
                        )}
                        {a.status !== "PENDING" && (
                          <span className="font-mono text-xs text-muted">
                            {inc?.incident_number ?? "—"}
                          </span>
                        )}
                        {a.eta_minutes != null && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                            {dict.team.eta} {Math.round(a.eta_minutes)} min ·{" "}
                            {(a.distance_km ?? 0).toFixed(1)} km
                          </span>
                        )}
                      </div>

                      {inc ? (
                        <>
                          <p className="mt-2.5 text-sm leading-relaxed">
                            {inc.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                            <span>
                              {" "}
                              {inc.location_text ??
                                `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}
                            </span>
                            <span> {inc.people_affected} people</span>
                            {inc.required_capabilities.length > 0 && (
                              <span>Needs: {inc.required_capabilities.join(", ")}</span>
                            )}
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&origin=${team?.latitude ?? ""},${team?.longitude ?? ""}&destination=${inc.latitude},${inc.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--color-border)] text-sm font-medium transition-colors hover:bg-gray-50 active:scale-[0.99]"
                            >
                               {dict.team.navigate}
                            </a>
                            {a.status !== "PENDING" && inc.status !== "ESCALATED" && (
                              <button
                                disabled={busy}
                                onClick={() => escalate(inc.id)}
                                className="inline-flex h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 active:scale-[0.99]"
                              >
                                 {dict.team.needBackup}
                              </button>
                            )}
                          </div>
                        </>
                      ): (
                        <p className="mt-2 text-sm text-muted">{dict.team.loadingIncident}</p>
                      )}

                      {getAction(a.status) && (
                        <button
                          disabled={busy}
                          onClick={() => advanceAssignment(a)}
                          className="mt-4 h-12 w-full rounded-xl bg-[var(--color-accent)] text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
                        >
                          {getAction(a.status)!.label} →
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
