"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

const CATEGORIES_RAW = [
  { value: "FLOOD", icon: "🌊" },
  { value: "FIRE", icon: "🔥" },
  { value: "LANDSLIDE", icon: "⛰️" },
  { value: "STRUCTURAL_COLLAPSE", icon: "🏚️" },
  { value: "MEDICAL_EMERGENCY", icon: "🚑" },
  { value: "EARTHQUAKE", icon: "🫨" },
  { value: "CYCLONE", icon: "🌀" },
  { value: "OTHER", icon: "⚠️" },
] as const;

type Step = 1 | 2 | 3;

export default function ReportPage() {
  const { dict } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [people, setPeople] = useState(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [landmark, setLandmark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incidentNumber, setIncidentNumber] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      setSignedIn(!!user);
    })();
  }, []);

  function detectLocation() {
    if (!navigator.geolocation) {
      setError("Location not supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setError("Could not get location - check permissions");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit() {
    setError(null);

    if (!coords) {
      setError("Please detect your location first");
      return;
    }
    if (description.trim().length < 5) {
      setError("Please describe the situation");
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;

      if (photo) {
        const supabase = createClient();
        const ext = photo.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("incident-photos")
          .upload(path, photo);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("incident-photos").getPublicUrl(path);
        photoUrl = data.publicUrl;
      }

      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: category || "OTHER",
          description: description.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          location_text: landmark.trim() || null,
          people_affected: people,
          photo_url: photoUrl,
          source: "APP",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not submit report");

      setIncidentNumber(
        json.incident?.incident_number ||
          (json.incident?.id
            ? `INC-${json.incident.id.slice(0, 6).toUpperCase()}`
            : "INC-RECORDED")
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Success ----------
  if (incidentNumber) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold">{dict.citizenReport.successTitle}</h1>
        <p className="mt-2 text-muted">
          {dict.citizenReport.successDesc}
        </p>
        <div className="mt-6 w-full rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted">
            {dict.citizenReport.reportNumber}
          </div>
          <div className="mt-1 font-mono text-2xl font-bold">{incidentNumber}</div>
        </div>
        <p className="mt-4 text-sm text-muted">
          {signedIn
            ? dict.citizenReport.trackSigned
            : dict.citizenReport.trackGuest}
        </p>
        {signedIn ? (
          <Link
            href="/citizen"
            className="mt-8 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)] active:scale-[0.99]"
          >
            {dict.citizenReport.goToDashboard}
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="mt-8 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)] active:scale-[0.99]"
            >
              {dict.citizenReport.createAccount}
            </Link>
            <Link
              href="/"
              className="mt-3 inline-flex h-11 w-full max-w-xs items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-sm font-medium hover:bg-gray-50"
            >
              {dict.citizenReport.backHome}
            </Link>
          </>
        )}
      </main>
    );
  }

  // ---------- Wizard ----------
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-12 pt-4 sm:px-6 sm:pt-10">
      <header className="sticky top-0 z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-transparent bg-gray-50/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Back" className="rounded-lg px-2 py-1 text-xl text-muted transition-colors hover:bg-gray-200/70 hover:text-foreground">
            ←
          </Link>
          <h1 className="text-lg font-bold">{dict.citizenReport.title}</h1>
        </div>
        <LanguageSelector variant="compact" />
      </header>

      {/* Progress dots */}
      <div className="mb-6 flex items-center gap-2 px-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-[var(--color-primary)]" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <section>
          <h2 className="mb-1 text-xl font-bold">{dict.citizenReport.whatIsHappening}</h2>
          <p className="mb-4 text-sm text-muted">{dict.citizenReport.pickClosest}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES_RAW.map((c) => {
              const label =
                (dict.citizenReport.categories as Record<string, string>)[c.value] ?? c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => {
                    setCategory(c.value);
                    setStep(2);
                  }}
                  className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-white p-3 shadow-sm transition-all hover:border-gray-300 active:scale-[0.97] ${
                    category === c.value
                      ? "border-[var(--color-primary)]"
                      : "border-transparent"
                  }`}
                >
                  <span className="text-3xl">{c.icon}</span>
                  <span className="text-xs font-medium text-center">{label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{dict.citizenReport.tellUsMore}</h2>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={dict.citizenReport.describePlaceholder}
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-white p-4 text-base focus:outline-2 focus:outline-[var(--color-primary)]"
          />

          <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <span className="text-sm font-medium">{dict.citizenReport.peopleNeedingHelp}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPeople((p) => Math.max(1, p - 1))}
                className="h-9 w-9 rounded-full border border-[var(--color-border)] text-lg hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-8 text-center text-lg font-bold">{people}</span>
              <button
                onClick={() => setPeople((p) => Math.min(999, p + 1))}
                className="h-9 w-9 rounded-full border border-[var(--color-border)] text-lg hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          <label className="mt-4 block cursor-pointer rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white p-6 text-center shadow-sm">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
            {photo ? (
              <span className="text-sm font-medium text-green-600">
                📷 {dict.citizenReport.photoAttached} ({photo.name.slice(0, 24)})
              </span>
            ) : (
              <span className="text-sm text-muted">
                📷 {dict.citizenReport.addPhoto} <span className="text-xs">({dict.citizenReport.optional})</span>
              </span>
            )}
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-sm font-medium transition-colors hover:bg-gray-50 active:scale-[0.99]"
            >
              {dict.citizenReport.back}
            </button>
            <button
              onClick={() => description.trim().length >= 5 && setStep(3)}
              disabled={description.trim().length < 5}
              className="inline-flex h-12 flex-[2] items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
            >
              {dict.citizenReport.next}
            </button>
          </div>
        </section>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <section>
          <h2 className="mb-1 text-xl font-bold">{dict.citizenReport.whereAreYou}</h2>
          <p className="mb-4 text-sm text-muted">
            {dict.citizenReport.gpsPrivacyNotice}
          </p>

          <button
            onClick={detectLocation}
            className={`w-full rounded-xl border-2 p-5 text-left transition-colors ${
              coords
                ? "border-green-400 bg-green-50"
                : "border-dashed border-[var(--color-accent)] bg-blue-50/50"
            }`}
          >
            {locating ? (
              <span className="text-sm font-medium">📍 {dict.citizenReport.detectingLocation}</span>
            ) : coords ? (
              <>
                <span className="block text-sm font-semibold text-green-700">
                  ✓ {dict.citizenReport.locationDetected}
                </span>
                <span className="text-xs text-muted">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              </>
            ) : (
              <>
                <span className="block text-sm font-semibold text-[var(--color-accent)]">
                  📍 {dict.citizenReport.detectLocation}
                </span>
                <span className="text-xs text-muted">{dict.citizenReport.tapGps}</span>
              </>
            )}
          </button>

          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder={dict.citizenReport.landmarkPlaceholder}
            className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-white p-4 text-base focus:outline-2 focus:outline-[var(--color-primary)]"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-[var(--color-primary)]">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-sm font-medium transition-colors hover:bg-gray-50 active:scale-[0.99]"
            >
              {dict.citizenReport.back}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !coords}
              className="inline-flex h-12 flex-[2] items-center justify-center rounded-xl bg-[var(--color-primary)] text-base font-bold text-white transition-all hover:bg-[var(--color-primary-dark)] active:scale-[0.99] disabled:opacity-40"
            >
              {submitting ? dict.citizenReport.sending : dict.citizenReport.sendReport}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
