// ============================================================
// ResQ SMS Parser (connectivity-fallback channel)
//
// Expected format: "SOS <TYPE> <free text> [N] people"
// Examples:
//   "SOS FLOOD near ward 12 bridge 5 people"
//   "SOS HELP water entering house 3 trapped elderly"
//   "SOS FIRE building on fire 12 people"
//
// Deliberately rule-based for the MVP - deterministic, offline-safe,
// and explainable. AI classification upgrades this in Phase 5.
// ============================================================

import type { IncidentSeverity, IncidentType } from "@/types/database";

const TYPE_KEYWORDS: Record<IncidentType, string[]> = {
  FLOOD: ["flood", "water", "waterlogging", "drowning", "inundat"],
  FIRE: ["fire", "smoke", "burn", "blaze"],
  LANDSLIDE: ["landslide", "mudslide", "mud"],
  STRUCTURAL_COLLAPSE: ["collapse", "collapsed", "rubble", "debris", "wall"],
  MEDICAL_EMERGENCY: ["medical", "injur", "bleeding", "pregnan", "heart", "unconscious"],
  EARTHQUAKE: ["earthquake", "quake", "tremor"],
  CYCLONE: ["cyclone", "storm", "hurricane"],
  OTHER: [],
};

const SEVERITY_HINTS: { severity: IncidentSeverity; keywords: string[] }[] = [
  {
    severity: "CRITICAL",
    keywords: ["trapped", "critical", "urgent", "dying", "collapse", "severe bleeding", "unconscious", "pregnan"],
  },
  { severity: "HIGH", keywords: ["rising", "cut off", "stranded", "injured", "heavy"] },
  { severity: "MEDIUM", keywords: ["waterlogging", "blocked", "slow"] },
];

export interface ParsedSms {
  ok: boolean;
  error?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  peopleAffected: number;
}

export function parseSms(rawMessage: string): ParsedSms {
  const message = rawMessage.trim();
  const upper = message.toUpperCase();

  if (!/^SOS\b/.test(upper)) {
    return {
      ok: false,
      error: "Message must start with SOS",
      type: "OTHER",
      severity: "MEDIUM",
      description: message,
      peopleAffected: 1,
    };
  }

  const body = message.replace(/^\s*SOS\s*/i, "");

  // People count: "<N> people" / "<N> trapped" / "people: N" or bare number
  let peopleAffected = 1;
  const explicit =
    /\b(\d{1,5})\s*(?:people|persons|ppl|trapped|stuck|affected)/i.exec(body) ??
    /(?:people|persons|trapped)\s*[:\-]?\s*(\d{1,5})/i.exec(body);
  if (explicit) {
    peopleAffected = Math.max(1, Math.min(9999, parseInt(explicit[1], 10)));
  }

  // Hazard type
  let type: IncidentType = "OTHER";
  outer: for (const [candidate, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (body.toLowerCase().includes(kw)) {
        type = candidate as IncidentType;
        break outer;
      }
    }
  }
  if (type === "OTHER") {
    // Direct enum mention e.g. "SOS FLOOD ..."
    for (const candidate of Object.keys(TYPE_KEYWORDS)) {
      if (upper.includes(candidate)) {
        type = candidate as IncidentType;
        break;
      }
    }
  }

  // Severity from urgency language, else infer from count
  let severity: IncidentSeverity | null = null;
  for (const hint of SEVERITY_HINTS) {
    if (hint.keywords.some((kw) => body.toLowerCase().includes(kw))) {
      severity = hint.severity;
      break;
    }
  }
  if (!severity) {
    severity =
      peopleAffected >= 10 ? "HIGH" : peopleAffected >= 4 ? "MEDIUM" : "LOW";
  }

  return {
    ok: true,
    type,
    severity,
    description: body,
    peopleAffected,
  };
}

