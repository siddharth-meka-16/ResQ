import Link from "next/link";
import { getSafeUser, getUserRole } from "@/lib/supabase/server";
import { AreaStatus } from "@/components/weather/AreaStatus";
import { Logo } from "@/components/ui/Logo";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { JudgeDemoBar } from "@/components/JudgeDemoBar";
import {
  ShieldAlert,
  Compass,
  HeartPulse,
  Heart,
  Users,
  Building2,
  Navigation,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  Flame,
} from "lucide-react";

const ROLE_ROUTES: Record<string, string> = {
  CITIZEN: "/citizen",
  OPERATOR: "/dashboard",
  ADMIN: "/dashboard",
  FIELD_TEAM: "/team",
  SHELTER_MANAGER: "/shelter-manage",
};

const PERSONAS = [
  {
    href: "/report",
    title: "Citizen SOS Report",
    desc: "Report life-threatening emergencies in under 60 seconds. Auto GPS coordinates, photo attachment, zero login barrier.",
    cta: "Report Emergency Now",
    accent: true,
    badge: "Public Access",
    color: "bg-red-500",
  },
  {
    href: "/dashboard",
    title: "Incident Command Console",
    desc: "District map with real-time AI report clustering, optimal team allocation scores, and live operational telemetry.",
    cta: "Open Operations Console",
    accent: false,
    badge: "Authority",
    color: "bg-blue-600",
  },
  {
    href: "/dashboard/replanning",
    title: "Dynamic Route Replanning",
    desc: "Simulate severed bridges and submerged roads. Watch ResQ autonomously switch vehicle types and reroute around hazard zones.",
    cta: "Open Replanning Sandbox",
    accent: false,
    badge: "AI Autopilot",
    color: "bg-amber-600",
  },
  {
    href: "/hospitals",
    title: "Hospital ICU & Bed Grid",
    desc: "District trauma capacity telemetry with ICU bed availability, oxygen reserve countdown, and automated ambulance divert rerouting.",
    cta: "View Hospital Telemetry",
    accent: false,
    badge: "Medical Ops",
    color: "bg-emerald-600",
  },
  {
    href: "/reunite",
    title: "Family Reunite & Missing Persons",
    desc: "Reconcile separated relatives with shelter check-ins using automated multi-attribute matching and privacy safeguards.",
    cta: "Search & Report Missing",
    accent: false,
    badge: "Social Good",
    color: "bg-rose-600",
  },
  {
    href: "/team",
    title: "Field Rescue Team",
    desc: "On-scene mobile terminal for dispatched units. Acknowledge missions, navigate routes, and broadcast live field updates.",
    cta: "Mission Console",
    accent: false,
    badge: "First Responder",
    color: "bg-indigo-600",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Multimodal Citizen Ingestion",
    text: "Citizens report via web wizard or fallback SMS with automatic geolocation and camera evidence — no app download required.",
  },
  {
    step: "02",
    title: "Autonomous AI Triage",
    text: "Incoming reports are classified by urgency and deduplicated into verified incident clusters with algorithmic confidence scores.",
  },
  {
    step: "03",
    title: "Multi-Factor Dispatch Scoring",
    text: "The allocation engine evaluates candidate rescue teams across distance, equipment capabilities, and vehicle capacity.",
  },
  {
    step: "04",
    title: "Dynamic Edge Replanning",
    text: "If rising floodwaters submerge a transit route, the graph engine invalidates the edge and reroutes units via watercraft.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getSafeUser();
  const signedIn = !!user;
  const role = signedIn ? await getUserRole() : null;
  const consoleHref = (role && ROLE_ROUTES[role]) || "/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Universal Top Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={40} />
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-gray-900 leading-none">
                  ResQ
                </span>
                <span className="text-[10px] font-bold text-red-600 tracking-wider uppercase">
                  Autonomous Disaster Response
                </span>
              </div>
            </Link>

            {/* Direct Feature Links */}
            <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-gray-600">
              <Link href="/report" className="hover:text-red-600 transition-colors">
                Citizen SOS
              </Link>
              <Link href="/dashboard/replanning" className="hover:text-red-600 transition-colors">
                Route Replanning
              </Link>
              <Link href="/hospitals" className="hover:text-red-600 transition-colors">
                Hospital Beds
              </Link>
              <Link href="/reunite" className="hover:text-red-600 transition-colors">
                Reunite
              </Link>
              <Link href="/dashboard" className="hover:text-red-600 transition-colors">
                Control Room
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />

            {signedIn ? (
              <Link
                href={consoleHref}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-700"
              >
                Open Operations Console →
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-xs hover:bg-gray-50"
                >
                  Demo Control Room
                </Link>
                <Link
                  href="/report"
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-700"
                >
                  Emergency SOS →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-gray-50/80 via-white to-white pb-14 pt-12 sm:pt-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            {error === "unauthorized" && (
              <div className="mx-auto mb-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 font-semibold">
                Authorization required. Sign in or continue in public demo mode.
              </div>
            )}

            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 px-3 py-1 text-xs font-bold text-red-700 mb-6 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>Next-Gen Autonomous Disaster Response Platform</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl sm:leading-tight">
              One platform for the entire response —{" "}
              <span className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 bg-clip-text text-transparent">
                from first SOS to resolved.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              ResQ unifies citizen distress reports, official meteorological radar telemetry, and hospital trauma beds into an autonomous dispatch and dynamic route-replanning engine.
            </p>

            {/* Quick Action CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/report"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-7 text-base font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-700 active:scale-[0.99] sm:w-auto"
              >
                <Flame className="h-5 w-5" />
                Report an Emergency (SOS)
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-7 text-base font-bold text-gray-900 shadow-xs transition-all hover:bg-gray-50 active:scale-[0.99] sm:w-auto"
              >
                <Compass className="h-5 w-5 text-gray-700" />
                Launch Control Room
              </Link>
            </div>
            <div className="mt-2 text-xs font-medium text-gray-400">
              Zero login required for SOS · Geolocation enabled · Works 100% offline
            </div>
          </div>
        </section>

        {/* Live Environmental Telemetry (Open-Meteo Weather) */}
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Live Environmental Telemetry & Risk Index
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● Open-Meteo Satellite Feed Active
            </span>
          </div>
          <AreaStatus />
        </section>

        {/* 6 High-Impact Persona Cards */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Operational Personas
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Select any role below to evaluate live workflows and role-specific interfaces.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PERSONAS.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className={`group flex flex-col rounded-3xl border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99] ${
                  p.accent
                    ? "border-red-200 bg-gradient-to-b from-red-50/50 to-white"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      p.accent
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.badge}
                  </span>
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${p.color}`}
                  />
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  {p.title}
                </h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-gray-500">
                  {p.desc}
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 group-hover:gap-2 transition-all">
                  <span>{p.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4-Step Technical Workflow */}
        <section className="border-y border-gray-200 bg-gray-50/70 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
                Architectural Pipeline
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
                How ResQ Coordinates District Response
              </h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="relative rounded-3xl bg-white p-6 shadow-xs border border-gray-200"
                >
                  <span className="text-3xl font-black text-gray-200 font-mono">
                    {s.step}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-gray-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Emergency Helplines & System Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={36} />
              <b className="text-lg font-black text-gray-900">ResQ</b>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Autonomous Disaster Response &amp; Multi-Agency Resource Coordination Engine. Engineered for high-stress offline resilience and millisecond dispatch optimization.
            </p>
          </div>

          <div>
            <b className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Emergency Helplines
            </b>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
              <li>
                <a href="tel:112" className="font-bold text-red-600 hover:underline">
                  112
                </a>{" "}
                — Unified National Emergency
              </li>
              <li>
                <a href="tel:108" className="font-bold text-gray-900 hover:underline">
                  108
                </a>{" "}
                — Emergency Ambulance &amp; Trauma
              </li>
              <li>
                <a href="tel:1078" className="font-bold text-gray-900 hover:underline">
                  1078
                </a>{" "}
                — Disaster Operations Command
              </li>
            </ul>
          </div>

          <div>
            <b className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Fast Navigation
            </b>
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              <li>
                <Link href="/report" className="hover:text-red-600">
                  Citizen SOS Wizard
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-red-600">
                  Operations Console
                </Link>
              </li>
              <li>
                <Link href="/dashboard/replanning" className="hover:text-red-600">
                  Dynamic Route Replanning
                </Link>
              </li>
              <li>
                <Link href="/hospitals" className="hover:text-red-600">
                  Hospital Bed Telemetry
                </Link>
              </li>
              <li>
                <Link href="/reunite" className="hover:text-red-600">
                  Missing Persons Reunite
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Floating Judge Quick Tour Bar */}
      <JudgeDemoBar />
    </div>
  );
}
