"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Incident } from "@/types/database";
import { useTranslation } from "@/context/LanguageContext";

export type IncidentFilter = "ACTIVE" | "CRITICAL" | "UNASSIGNED" | "RESOLVED";

export function IncidentListPanel({
  incidents,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  clusterSizes,
}: {
  incidents: Incident[];
  filter: IncidentFilter;
  onFilterChange: (f: IncidentFilter) => void;
  search: string;
  onSearchChange: (s: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  clusterSizes?: Map<string, number>;
}) {
  const { dict } = useTranslation();

  const filters = [
    { value: "ACTIVE" as const, label: dict.incidents.activeFilter },
    { value: "CRITICAL" as const, label: dict.incidents.criticalFilter },
    { value: "UNASSIGNED" as const, label: dict.incidents.unassignedFilter },
    { value: "RESOLVED" as const, label: dict.common.resolved },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = incidents;
    if (filter === "ACTIVE")
      list = list.filter((i) => !["RESOLVED", "CANCELLED"].includes(i.status));
    if (filter === "CRITICAL") list = list.filter((i) => i.severity === "CRITICAL");
    if (filter === "UNASSIGNED")
      list = list.filter((i) => ["REPORTED", "VALIDATED", "UNASSIGNED", "ESCALATED"].includes(i.status));
    if (filter === "RESOLVED") list = list.filter((i) => i.status === "RESOLVED");
    if (q)
      list = list.filter(
        (i) =>
          (i.incident_number || "").toLowerCase().includes(q) ||
          (i.description || "").toLowerCase().includes(q) ||
          (i.location_text || "").toLowerCase().includes(q)
      );
    return list.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const aOrder = order[a.severity] ?? 2;
      const bOrder = order[b.severity] ?? 2;
      return aOrder - bOrder;
    });
  }, [incidents, filter, search]);

  const getSeverityLabel = (sev?: string) => {
    if (!sev) return "MEDIUM";
    return (dict.incidents.severities as Record<string, string>)[sev] ?? sev;
  };

  const getCategoryLabel = (cat?: string) => {
    if (!cat) return "Emergency";
    return (dict.incidents.categories as Record<string, string>)[cat] ?? cat.replace(/_/g, " ");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border)] p-3">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={dict.incidents.searchPlaceholder}
          className="mb-2 w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm focus:outline-2 focus:outline-[var(--color-accent)]"
        />
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                filter === f.value
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-muted hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map((i) => (
          <button
            key={i.id}
            onClick={() => onSelect(i.id)}
            className={`mb-2 w-full rounded-lg border bg-white p-3 text-left transition-colors ${
              selectedId === i.id
                ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]"
                : "border-[var(--color-border)] hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted">
                {i.incident_number || `INC-${(i.id || "").slice(0, 6).toUpperCase()}`}
              </span>
              <Badge label={getSeverityLabel(i.severity)} color={i.severity} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm">{i.description}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
              <span>{getCategoryLabel(i.type)}</span>
              <span>·</span>
              <span>{i.people_affected ?? (i as any).trapped_count ?? 1} affected</span>
              <span>·</span>
              <span
                title={dict.incidents.aiConfidence}
                className={(i.confidence_score ?? 0.8) >= 0.8 ? "font-medium text-green-600" : ""}
              >
                {Math.round((i.confidence_score ?? 0.8) * 100)}%
              </span>
              {clusterSizes && clusterSizes.has(i.id) && (
                <span className="rounded-full bg-blue-50 px-1.5 text-[10px] font-medium text-blue-700">
                  {clusterSizes.get(i.id)! + 1} {dict.incidents.corroborationReports}
                </span>
              )}
              {i.location_text && (
                <>
                  <span>·</span>
                  <span className="truncate">{i.location_text}</span>
                </>
              )}
            </div>
          </button>
        ))}
        {!filtered.length && (
          <p className="p-6 text-center text-sm text-muted">{dict.incidents.noIncidentsFound}</p>
        )}
      </div>
    </div>
  );
}
