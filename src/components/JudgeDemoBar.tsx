"use client";

import React, { useState } from "react";
import Link from "next/link";
import { audioAlerts } from "@/lib/audioAlerts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Compass,
  HeartPulse,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  Zap,
  Activity,
} from "lucide-react";

interface JudgeDemoBarProps {
  onScenarioTrigger?: (scenario: "SCENARIO_A" | "SCENARIO_B" | "SCENARIO_C" | "COPILOT", data?: any) => void;
  onReset?: () => void;
  className?: string;
}

export const JudgeDemoBar: React.FC<JudgeDemoBarProps> = ({
  onScenarioTrigger,
  onReset,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [archTab, setArchTab] = useState<"roles" | "tracking" | "learning" | "workflow">("roles");
  const [activeDialog, setActiveDialog] = useState<null | {
    title: string;
    scenario: "A" | "B" | "C" | "COPILOT";
    badgeText: string;
    details: React.ReactNode;
  }>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Scenario A: Bridge Submergence & Dynamic Replanning
  const handleScenarioA = async () => {
    setLoadingAction("A");
    try {
      audioAlerts.playReplanningAlert();

      await fetch("/api/replanning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hazardType: "FLOODED",
          title: "Main River Bridge Submerged (+120cm Floodwater)",
          latitude: 22.234,
          longitude: 84.818,
          waterDepthCm: 120,
        }),
      });

      setActiveDialog({
        title: "Scenario A: Flash Flood Obstruction & Autonomous Route Replanning",
        scenario: "A",
        badgeText: "AUTONOMOUS REROUTE",
        details: (
          <div className="space-y-3 text-xs text-gray-800">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>DISASTER BLOCKAGE: Main River Bridge flooded under 1.2m of water. Route edge invalidated in 140ms.</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="font-bold text-gray-900 uppercase">System Decision:</div>
              <p className="text-gray-600 leading-relaxed">
                Truck RT-003 ground passage aborted. Mission equipment requirement upgraded from <span className="font-bold text-red-600">TRUCK</span> to{" "}
                <span className="font-bold text-cyan-600">SWIFT-WATER MOTORBOAT</span> (Boat Unit RT-001) traversing the river channel.
              </p>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-[10px] text-gray-400">Truck Overland Delay</div>
                  <div className="font-bold text-red-600">+14.0 min penalty</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-[10px] text-gray-400">Boat Channel ETA</div>
                  <div className="font-bold text-emerald-600">8.5 mins (Direct)</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link href="/dashboard/replanning">
                <Button variant="primary" size="sm" className="text-xs">
                  Inspect in Replanning Sandbox →
                </Button>
              </Link>
            </div>
          </div>
        ),
      });

      if (onScenarioTrigger) onScenarioTrigger("SCENARIO_A");
      showToast("⚡ Scenario A Triggered: Bridge blocked & vehicle switched to Boat.");
    } catch {
      showToast("Triggered Scenario A (demo mode).");
    } finally {
      setLoadingAction(null);
    }
  };

  // Scenario B: Hospital Mass Casualty & Bed Diversion
  const handleScenarioB = async () => {
    setLoadingAction("B");
    try {
      audioAlerts.playDivertAlert();

      const res = await fetch("/api/hospitals/divert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentLatitude: 22.258,
          incidentLongitude: 84.835,
          requiresIcu: true,
          casualtyCount: 4,
        }),
      });
      const data = await res.json();
      const rec = data?.recommendedDestination;

      setActiveDialog({
        title: "Scenario B: Mass Casualty Surge & Hospital Bed Diversion",
        scenario: "B",
        badgeText: "EMERGENCY DIVERSION",
        details: (
          <div className="space-y-3 text-xs text-gray-800">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 shrink-0 text-amber-600" />
              <span>FACILITY OVERLOAD: Nearest Civil Hospital ICU at 100% saturation. Diversion lock engaged.</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="font-bold text-gray-900 uppercase">Automated Ambulance Reroute:</div>
              <p className="text-gray-600 leading-relaxed">
                4 critical trauma casualties diverted to <span className="font-bold text-emerald-700">{rec?.hospitalName || "Metro General Hospital"}</span> ({rec?.distanceKm || 3.8} km, ETA {rec?.etaMinutes || 7.2}m).
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-gray-200 font-mono text-[11px] text-gray-700">
                {rec?.rationale || "Diverted from nearest facility due to 0 ICU beds. Dispatched to facility with 11 confirmed beds."}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link href="/hospitals">
                <Button variant="primary" size="sm" className="text-xs">
                  Open District Hospital Telemetry →
                </Button>
              </Link>
            </div>
          </div>
        ),
      });

      if (onScenarioTrigger) onScenarioTrigger("SCENARIO_B", data);
      showToast("⚡ Scenario B Triggered: Hospital divert rerouting active.");
    } catch {
      showToast("Triggered Scenario B (demo mode).");
    } finally {
      setLoadingAction(null);
    }
  };

  // Scenario C: Shelter Family Check-in Auto-Match
  const handleScenarioC = async () => {
    setLoadingAction("C");
    try {
      audioAlerts.playSuccessChime();

      setActiveDialog({
        title: "Scenario C: Separated Child Auto-Reconciliation at Shelter",
        scenario: "C",
        badgeText: "96% RECONCILIATION MATCH",
        details: (
          <div className="space-y-3 text-xs text-gray-800">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>MATCH VERIFIED: Missing inquiry for 'Aarav Sharma' reconciled with Sector 4 Shelter intake registry.</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
              <div className="font-bold text-gray-900">Corroborated Attributes:</div>
              <ul className="space-y-1 text-gray-600">
                <li>• Exact name: Aarav Sharma (Age 7)</li>
                <li>• Physical match: Yellow t-shirt & blue shorts confirmed by intake nurse</li>
                <li>• Privacy gate: Shelter bay release code sent to verified parent</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <Link href="/reunite">
                <Button variant="primary" size="sm" className="text-xs bg-rose-600 hover:bg-rose-700">
                  Open Reunite Portal →
                </Button>
              </Link>
            </div>
          </div>
        ),
      });

      if (onScenarioTrigger) onScenarioTrigger("SCENARIO_C");
      showToast("⚡ Scenario C Triggered: 96% family reconciliation match found.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopilot = async () => {
    setLoadingAction("COPILOT");
    try {
      audioAlerts.playTacticalPing();
      const res = await fetch("/api/ai/copilot");
      const json = await res.json();
      const adv = json.advisory;

      setActiveDialog({
        title: "Gemini AI Tactical Commander Copilot: Live Advisory",
        scenario: "COPILOT",
        badgeText: adv?.threatLevel || "ELEVATED",
        details: (
          <div className="space-y-3 text-xs text-gray-800">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                Executive Ground Truth Assessment:
              </div>
              <p className="mt-1 text-slate-700 leading-relaxed">{adv?.situationSummary}</p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                Prioritized Tactical Directives:
              </div>
              <div className="space-y-1.5">
                {adv?.immediateActions?.map((act: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.target}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        act.urgency === "P0" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {act.urgency}
                      </span>
                    </div>
                    <div className="mt-1 text-blue-900 font-medium">{act.action}</div>
                    <div className="mt-0.5 text-muted text-[11px]">{act.rationale}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-muted font-medium">
                Engine: {adv?.generatedBy === "GEMINI_2_0_FLASH" ? "Google Gemini 2.0 Flash" : "ResQ Neural Core"}
              </span>
              <Link href="/dashboard/replanning">
                <Button variant="primary" size="sm" className="text-xs">
                  Inspect Operations Map →
                </Button>
              </Link>
            </div>
          </div>
        ),
      });
      if (onScenarioTrigger) onScenarioTrigger("COPILOT");
      showToast("⚡ Gemini Copilot: Strategic advisory generated in real-time.");
    } catch {
      showToast("Could not generate Copilot advisory");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFullReset = async () => {
    setLoadingAction("RESET");
    try {
      audioAlerts.playSuccessChime();
      if (onReset) onReset();
      showToast("✓ System reset to nominal operational baseline.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-gray-700 flex items-center gap-2 animate-bounce">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Floating Pill Bar */}
      <div
        className={`fixed bottom-4 right-4 z-[9000] transition-all duration-200 ${className}`}
      >
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-gray-700 hover:bg-black transition-all cursor-pointer group"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide">
              🎯 Judge Quick Tour
            </span>
            <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white" />
          </button>
        ) : (
          <div className="w-[340px] sm:w-[380px] bg-white rounded-3xl border border-gray-200 shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-gray-900">
                  🎯 ResQ Judge Quick Tour
                </span>
                <Badge color="CRITICAL" label="1-CLICK DEMO" />
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer rounded-lg hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[11px] text-gray-500 leading-snug">
              Instant triggers to evaluate real-time AI autonomous response, edge-case replanning, and hospital telemetry in under 60 seconds:
            </p>

            {/* Scenario Buttons */}
            <div className="space-y-1.5">
              <button
                onClick={handleScenarioA}
                disabled={!!loadingAction}
                className="w-full text-left p-2.5 bg-red-50/70 hover:bg-red-100/80 border border-red-200 rounded-xl transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-red-950">
                      Scenario A: Flood Bridge Cut & Boat Reroute
                    </div>
                    <div className="text-[10px] text-red-700">Autonomous reroute &lt; 200ms</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-600">Test →</span>
              </button>

              <button
                onClick={handleScenarioB}
                disabled={!!loadingAction}
                className="w-full text-left p-2.5 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 rounded-xl transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-950">
                      Scenario B: Hospital ICU Divert Reroute
                    </div>
                    <div className="text-[10px] text-amber-700">Automated casualty triage destination</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600">Test →</span>
              </button>

              <button
                onClick={handleScenarioC}
                disabled={!!loadingAction}
                className="w-full text-left p-2.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      Scenario C: Shelter Family Auto-Reunion
                    </div>
                    <div className="text-[10px] text-emerald-700">96% multi-trait fuzzy match</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">Test →</span>
              </button>

              <button
                onClick={handleCopilot}
                disabled={!!loadingAction}
                className="w-full text-left p-2.5 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-indigo-950">
                      Scenario D: AI Commander Copilot (Gemini)
                    </div>
                    <div className="text-[10px] text-indigo-700">Live multi-vector situational triage</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600">Consult →</span>
              </button>
            </div>

            {/* Architecture Q&A Guide for Judges */}
            <button
              onClick={() => setIsArchOpen(true)}
              className="w-full p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="h-4 w-4 text-white shrink-0" />
                <div>
                  <div className="text-xs font-bold">System Architecture & Judges Q&A</div>
                  <div className="text-[10px] text-blue-100">Roles, Tracking, Learning & Workflows</div>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Guide →</span>
            </button>

            {/* Quick Links to Key Views */}
            <div className="pt-2 border-t border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Direct View Launchers
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold text-gray-700">
                <Link
                  href="/report"
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-center truncate border border-gray-100"
                >
                  Citizen SOS
                </Link>
                <Link
                  href="/dashboard"
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-center truncate border border-gray-100"
                >
                  Control Room
                </Link>
                <Link
                  href="/dashboard/replanning"
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-center truncate border border-gray-100"
                >
                  Replanning
                </Link>
                <Link
                  href="/hospitals"
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-center truncate border border-gray-100"
                >
                  Hospitals
                </Link>
                <Link
                  href="/reunite"
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-center truncate border border-gray-100"
                >
                  Reunite
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-center truncate border border-blue-200"
                >
                  AI Learning
                </Link>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleFullReset}
              className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1.5 cursor-pointer pt-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset All Live Demo Data
            </button>
          </div>
        )}
      </div>

      {/* Architecture & Judges Q&A Modal */}
      {isArchOpen && (
        <div className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  ResQ System Architecture & Evaluation Blueprint
                </span>
                <h2 className="text-lg font-bold mt-0.5">Answers to Core Judge Questions</h2>
              </div>
              <button
                onClick={() => setIsArchOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 px-4">
              <button
                onClick={() => setArchTab("roles")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition ${
                  archTab === "roles" ? "border-blue-600 text-blue-700" : "border-transparent text-muted hover:text-gray-900"
                }`}
              >
                1. 4 User Roles & Personas
              </button>
              <button
                onClick={() => setArchTab("tracking")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition ${
                  archTab === "tracking" ? "border-blue-600 text-blue-700" : "border-transparent text-muted hover:text-gray-900"
                }`}
              >
                2. Information Sharing & Tracking
              </button>
              <button
                onClick={() => setArchTab("learning")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition ${
                  archTab === "learning" ? "border-blue-600 text-blue-700" : "border-transparent text-muted hover:text-gray-900"
                }`}
              >
                3. Past Data & Continuous Learning
              </button>
              <button
                onClick={() => setArchTab("workflow")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition ${
                  archTab === "workflow" ? "border-blue-600 text-blue-700" : "border-transparent text-muted hover:text-gray-900"
                }`}
              >
                4. End-to-End Workflow
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 space-y-4">
              {archTab === "roles" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                      <div className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                        <span>👤</span> 1. Citizen / Affected Community
                      </div>
                      <p className="mt-1 text-slate-600 leading-relaxed">
                        • Zero-login emergency reporting with GPS, voice/text & photo.<br />
                        • Real-time status tracking via ticket (<code className="font-mono bg-white px-1">INC-XXXX</code>).<br />
                        • Safe shelter finder and missing relative search.
                      </p>
                    </div>

                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                      <div className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                        <span>🛡️</span> 2. Control Room Operator / Commander
                      </div>
                      <p className="mt-1 text-slate-600 leading-relaxed">
                        • Unified Common Operating Picture (COP) with live GIS & weather.<br />
                        • Automated AI report deduplication and 500m clustering.<br />
                        • 5-factor dispatch formula & dynamic corridor replanning.
                      </p>
                    </div>

                    <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl">
                      <div className="font-bold text-red-900 text-sm flex items-center gap-1.5">
                        <span>🚒</span> 3. Field Rescue Team (NDRF / SDRF)
                      </div>
                      <p className="mt-1 text-slate-600 leading-relaxed">
                        • Low-bandwidth mobile console on <code className="font-mono bg-white px-1">/team</code>.<br />
                        • Turn-by-turn routing avoiding impassable flooded roads.<br />
                        • One-touch status updates: <code className="font-mono bg-white px-1">EN_ROUTE</code>, <code className="font-mono bg-white px-1">ON_SCENE</code>, <code className="font-mono bg-white px-1">RESOLVED</code>.
                      </p>
                    </div>

                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                        <span>🏠</span> 4. Shelter & Hospital Managers
                      </div>
                      <p className="mt-1 text-slate-600 leading-relaxed">
                        • Real-time ICU bed, surge capacity & oxygen reserve telemetry.<br />
                        • Automatic Divert signaling to reroute incoming casualties.<br />
                        • Relief stock monitoring and shelter survivor check-ins.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {archTab === "tracking" && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 text-sm">Real-time Information Sharing Architecture</div>
                    <p className="leading-relaxed">
                      • <b>Sub-100ms Event-Driven Sync:</b> Built on Supabase PostgreSQL Logical Replication over WebSockets. When an incident or road hazard changes, all connected consoles update instantly without polling.
                    </p>
                    <p className="leading-relaxed">
                      • <b>Geospatial Tracking:</b> Every incident and team possesses coordinates (<code className="font-mono bg-white px-1">latitude</code>, <code className="font-mono bg-white px-1">longitude</code>, and PostGIS points). Haversine calculations compute Euclidean proximity, dynamic ETAs, and road impedance.
                    </p>
                    <p className="leading-relaxed">
                      • <b>Proximity Clustering:</b> Corroborating reports of the same disaster within 500m and 30 minutes are merged under a single Cluster Head to eliminate duplicate team dispatches.
                    </p>
                    <p className="leading-relaxed">
                      • <b>SMS Fallback:</b> In zero-internet zones, offline SMS messages (<code className="font-mono bg-white px-1">SOS FLOOD 5 TRAPPED</code>) are parsed by the heuristic NLP classifier.
                    </p>
                  </div>
                </div>
              )}

              {archTab === "learning" && (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <div className="font-bold text-blue-950 text-sm">How ResQ Uses Previous Data for Future Cases</div>
                    <p className="leading-relaxed">
                      • <b>Predictive Hotspot Pre-Positioning:</b> By ingesting historical water rise patterns and collapse density, ResQ identifies recurring vulnerability zones (e.g. Ward 12, Riverbank Lowlands) and prescribes pre-disaster staging of rescue boats and dewatering pumps.
                    </p>
                    <p className="leading-relaxed">
                      • <b>Continuous Model Weight Tuning:</b> The allocation engine analyzes past travel time delays through flooded corridors and recalibrates dispatch weights (e.g. boosting <code className="font-mono bg-white px-1">travel_time_weight</code> from 20% to 35% during flood alerts).
                    </p>
                    <p className="leading-relaxed">
                      • <b>Gemini AI After-Action Reviews (AAR):</b> Ingests closed mission records to produce executive debriefs detailing operational bottlenecks, triage precision, and preventative policies for the next disaster cycle.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Link href="/dashboard/analytics">
                      <Button size="sm" variant="primary" className="text-xs">
                        Open Continuous Learning Dashboard →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {archTab === "workflow" && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 text-sm">End-to-End Coordinated Lifecycle</div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center pt-2">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="font-bold text-blue-700">1. Citizen SOS</div>
                        <div className="text-[10px] text-muted mt-1">GPS + NLP extraction</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="font-bold text-indigo-700">2. Triage & Cluster</div>
                        <div className="text-[10px] text-muted mt-1">500m deduplication</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="font-bold text-purple-700">3. 5-Factor Dispatch</div>
                        <div className="text-[10px] text-muted mt-1">Capability + ETA match</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="font-bold text-red-700">4. Replanning</div>
                        <div className="text-[10px] text-muted mt-1">Hazard corridor bypass</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="font-bold text-green-700">5. Closed Loop</div>
                        <div className="text-[10px] text-muted mt-1">AAR learning record</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <span className="text-[11px] text-muted">
                ResQ Disaster Response Architecture • Hackathon Presentation Guide
              </span>
              <Button size="sm" variant="secondary" onClick={() => setIsArchOpen(false)}>
                Close Guide
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal when Scenario is clicked */}
      {activeDialog && (
        <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <Badge color="CRITICAL" label={activeDialog.badgeText} />
                <h3 className="text-base font-extrabold text-gray-900 mt-2">
                  {activeDialog.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDialog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {activeDialog.details}
          </div>
        </div>
      )}
    </>
  );
};
