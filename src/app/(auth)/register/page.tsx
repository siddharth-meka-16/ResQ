"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { routeByRole } from "@/lib/roleRouting";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

const ROLES = [
  {
    value: "CITIZEN",
    icon: "",
    label: "Citizen",
    desc: "Report emergencies, track help, find shelters",
    official: false,
  },
  {
    value: "OPERATOR",
    icon: "",
    label: "Control Room Operator",
    desc: "Triage incidents and dispatch rescue teams",
    official: true,
  },
  {
    value: "FIELD_TEAM",
    icon: "",
    label: "Field Rescue Team",
    desc: "Receive missions and update status on-scene",
    official: true,
  },
  {
    value: "SHELTER_MANAGER",
    icon: "",
    label: "Shelter Manager",
    desc: "Manage occupancy and relief supplies",
    official: true,
  },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("CITIZEN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Wrong email or password — try again"
          : error.message
      );
      setLoading(false);
      return;
    }

    // Auto-login immediately: backend trigger automatically confirms users
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!loginError) {
      const dest = await routeByRole("/dashboard");
      router.push(dest);
      router.refresh();
      return;
    }

    // Fallback if password sign-in didn't immediately succeed
    if (!data.session) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    const dest = await routeByRole("/dashboard");
    router.push(dest);
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
          <h1 className="mt-3 text-xl font-bold">Account Created</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your account for <b className="text-foreground">{email}</b> is ready!
          </p>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              const supabase = createClient();
              const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (!error) {
                const dest = await routeByRole("/dashboard");
                router.push(dest);
                router.refresh();
              } else {
                router.push("/login");
              }
            }}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            ⚡ Click to Enter Dashboard Now
          </button>
          <Link
            href="/login"
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[var(--color-border)] text-sm font-semibold text-muted transition-colors hover:bg-gray-100"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={48} />
            <span className="text-sm font-bold tracking-tight">ResQ</span>
          </Link>
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-gray-100 hover:text-foreground"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            Pick the role that describes you — it decides your console.
          </p>
        </div>

        {/* Quick 1-Click Demo Access */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              ⚡ Evaluating for Hackathon? 1-Click Instant Demo Login
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithPassword({
                  email: "operator@resq.gov",
                  password: "ResQ@2026!",
                });
                const dest = await routeByRole("/dashboard");
                router.push(dest);
                router.refresh();
              }}
              className="rounded-xl border border-blue-200 bg-white p-2.5 text-center text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-blue-50 active:scale-95"
            >
              <div className="text-base">🛡️</div>
              <div className="mt-1">Operator</div>
            </button>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithPassword({
                  email: "field@resq.gov",
                  password: "ResQ@2026!",
                });
                const dest = await routeByRole("/team");
                router.push(dest);
                router.refresh();
              }}
              className="rounded-xl border border-blue-200 bg-white p-2.5 text-center text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-blue-50 active:scale-95"
            >
              <div className="text-base">🚒</div>
              <div className="mt-1">Field Team</div>
            </button>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithPassword({
                  email: "shelter@resq.gov",
                  password: "ResQ@2026!",
                });
                const dest = await routeByRole("/shelter-manage");
                router.push(dest);
                router.refresh();
              }}
              className="rounded-xl border border-blue-200 bg-white p-2.5 text-center text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-blue-50 active:scale-95"
            >
              <div className="text-base">🏠</div>
              <div className="mt-1">Shelter Lead</div>
            </button>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithPassword({
                  email: "citizen@resq.org",
                  password: "ResQ@2026!",
                });
                const dest = await routeByRole("/citizen");
                router.push(dest);
                router.refresh();
              }}
              className="rounded-xl border border-blue-200 bg-white p-2.5 text-center text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-blue-50 active:scale-95"
            >
              <div className="text-base">👤</div>
              <div className="mt-1">Citizen</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role cards */}
          <fieldset>
            <legend className="sr-only">I am registering as</legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`cursor-pointer rounded-xl border-2 bg-white p-4 shadow-sm transition-all active:scale-[0.99] ${
                    role === r.value
                      ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
: "border-transparent hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <span>
                      <span className="block text-sm font-bold">
                        {r.label}
                        {r.official && (
                          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            gov.in email
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">
                        {r.desc}
                      </span>
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="password">Password (min 6)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text": "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password": "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
                  >
                    {showPassword ? "Hide": "Show"}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text": "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--color-primary)]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="mt-5 w-full"
            >
              {loading ? "Creating account...": "Create Account"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-[var(--color-accent)]">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-muted">
          Just need to report an emergency?{" "}
          <Link href="/report" className="font-medium underline">
            You can do that without an account
          </Link>
        </p>
      </main>
    </div>
  );
}
