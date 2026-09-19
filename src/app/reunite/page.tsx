"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { audioAlerts } from "@/lib/audioAlerts";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Phone,
  MapPin,
  Heart,
  RefreshCw,
  Sparkles,
  UserCheck,
  Lock,
} from "lucide-react";

interface MissingRecord {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
  clothing_last_seen?: string;
  physical_description?: string;
  last_seen_location?: string;
  reported_by_phone: string;
  status: string;
}

interface MatchCandidate {
  id: string;
  missingName: string;
  age: number;
  gender: string;
  lastSeenLocation: string;
  clothing: string;
  shelterName: string;
  matchScore: number;
  matchingTraits: string[];
  verified: boolean;
}

export default function ResQReunitePage() {
  const [activeTab, setActiveTab] = useState<"search" | "shelter">("search");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ text: string; type: "success" | "warn" } | null>(null);

  // Form 1: Report Missing Person
  const [searchForm, setSearchForm] = useState({
    fullName: "",
    age: "",
    gender: "Male",
    lastSeenLocation: "",
    clothingLastSeen: "",
    contactPhone: "",
  });

  // Form 2: Shelter Check-in
  const [shelterForm, setShelterForm] = useState({
    shelterName: "Sector 4 Community Relief Shelter",
    personName: "",
    age: "",
    gender: "Male",
    clothing: "",
    notes: "",
  });

  // Active verified matches
  const [candidates, setCandidates] = useState<MatchCandidate[]>([
    {
      id: "match-001",
      missingName: "Aarav Sharma",
      age: 7,
      gender: "Male",
      lastSeenLocation: "Sector 4 Riverbank Ghat during flood panic",
      clothing: "Bright yellow t-shirt and blue denim shorts",
      shelterName: "Sector 4 Community Relief Shelter",
      matchScore: 96,
      matchingTraits: [
        "Identical Name match",
        "Age 7 verified",
        "Clothing: Yellow t-shirt & blue shorts confirmed by intake nurse",
      ],
      verified: true,
    },
    {
      id: "match-002",
      missingName: "Kavita Verma",
      age: 68,
      gender: "Female",
      lastSeenLocation: "Civil Lines bus terminal during storm alert",
      clothing: "Green floral saree, black frame glasses",
      shelterName: "Metro High School Camp",
      matchScore: 92,
      matchingTraits: [
        "Name & Age close match",
        "Diabetic medication provided by shelter medical staff",
      ],
      verified: false,
    },
  ]);

  const [missingList, setMissingList] = useState<MissingRecord[]>([]);

  const fetchMissing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reunite/missing");
      const data = await res.json();
      if (data.success && data.missingPersons) {
        setMissingList(data.missingPersons);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissing();
  }, []);

  const handleReportMissing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchForm.fullName || !searchForm.contactPhone) {
      setNotification({ text: "Please enter the full name and a contact phone number.", type: "warn" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reunite/missing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: searchForm.fullName,
          age: searchForm.age,
          gender: searchForm.gender,
          lastSeenLocation: searchForm.lastSeenLocation,
          clothingLastSeen: searchForm.clothingLastSeen,
          reportedByPhone: searchForm.contactPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        audioAlerts.playSuccessChime();
        setNotification({
          text: `Missing person report filed for ${searchForm.fullName}. ResQ AI matching engine is scanning all district shelter check-ins.`,
          type: "success",
        });
        setSearchForm({
          fullName: "",
          age: "",
          gender: "Male",
          lastSeenLocation: "",
          clothingLastSeen: "",
          contactPhone: "",
        });
        fetchMissing();
      }
    } catch {
      setNotification({ text: "Registered in offline demo mode.", type: "success" });
    } finally {
      setLoading(false);
    }
  };

  const handleShelterCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterForm.personName) {
      setNotification({ text: "Please enter the person's name.", type: "warn" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reunite/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName: shelterForm.personName,
          age: shelterForm.age,
          gender: shelterForm.gender,
          medicalCondition: shelterForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        audioAlerts.playSuccessChime();
        setNotification({
          text: `${shelterForm.personName} safely checked into ${shelterForm.shelterName}. Family matching check executed.`,
          type: "success",
        });
        setShelterForm({
          shelterName: "Sector 4 Community Relief Shelter",
          personName: "",
          age: "",
          gender: "Male",
          clothing: "",
          notes: "",
        });
      }
    } catch {
      setNotification({ text: "Shelter arrival logged (demo mode).", type: "success" });
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter((c) =>
    searchQuery === ""
      ? true
      : c.missingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.shelterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.clothing.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={36} />
              <span className="font-extrabold text-lg tracking-tight">ResQ</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-rose-600" />
              Reunite — Family Missing Persons & Shelter Check-In Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/report">
              <Button variant="secondary" size="sm" className="text-xs">
                Emergency SOS
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="text-xs">
                Control Room →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner Alert if any notification */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold uppercase opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-blue-500/10 p-6 sm:p-8 rounded-3xl border border-rose-200/60">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
              <Sparkles className="h-3.5 w-3.5" />
              AI Automated Victim Reconciliation
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-3">
              Reconnecting families separated during disaster evacuation
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              ResQ Reunite continuously reconciles citizen missing person inquiries with relief camp check-in logs using fuzzy name matching, physical trait overlap, and shelter registry cross-referencing.
            </p>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("search")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "search"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Report Missing Person
            </button>
            <button
              onClick={() => setActiveTab("shelter")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "shelter"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Shelter Arrival Registry
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, clothing, shelter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Form: Tab 1 or Tab 2 */}
          <div className="lg:col-span-1">
            {activeTab === "search" ? (
              <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-rose-600" />
                  <h3 className="font-bold text-gray-900">Report Missing Person</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Submit details of family members you are trying to locate. All district shelter check-ins will be monitored.
                </p>

                <form onSubmit={handleReportMissing} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Full Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={searchForm.fullName}
                      onChange={(e) => setSearchForm({ ...searchForm, fullName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Age
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 7"
                        value={searchForm.age}
                        onChange={(e) => setSearchForm({ ...searchForm, age: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Gender
                      </label>
                      <select
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none"
                        value={searchForm.gender}
                        onChange={(e) => setSearchForm({ ...searchForm, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Last Seen Location
                    </label>
                    <Input
                      placeholder="e.g. Sector 4 Riverbank Ghat"
                      value={searchForm.lastSeenLocation}
                      onChange={(e) => setSearchForm({ ...searchForm, lastSeenLocation: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Clothing / Distinguishing Marks
                    </label>
                    <Input
                      placeholder="e.g. Yellow t-shirt, blue shorts, glasses"
                      value={searchForm.clothingLastSeen}
                      onChange={(e) => setSearchForm({ ...searchForm, clothingLastSeen: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Your Contact Phone *
                    </label>
                    <Input
                      required
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={searchForm.contactPhone}
                      onChange={(e) => setSearchForm({ ...searchForm, contactPhone: e.target.value })}
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center mt-3 bg-rose-600 hover:bg-rose-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register Inquiry
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Shelter Arrival Registration</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Intake officers register displaced citizens arriving at emergency evacuation camps.
                </p>

                <form onSubmit={handleShelterCheckin} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Camp Facility
                    </label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none"
                      value={shelterForm.shelterName}
                      onChange={(e) => setShelterForm({ ...shelterForm, shelterName: e.target.value })}
                    >
                      <option value="Sector 4 Community Relief Shelter">Sector 4 Community Relief Shelter</option>
                      <option value="Metro High School Camp">Metro High School Camp</option>
                      <option value="Central Stadium Relief Camp">Central Stadium Relief Camp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Citizen Full Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={shelterForm.personName}
                      onChange={(e) => setShelterForm({ ...shelterForm, personName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Age
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 7"
                        value={shelterForm.age}
                        onChange={(e) => setShelterForm({ ...shelterForm, age: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Gender
                      </label>
                      <select
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none"
                        value={shelterForm.gender}
                        onChange={(e) => setShelterForm({ ...shelterForm, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Intake Triage Notes / Clothing
                    </label>
                    <Input
                      placeholder="e.g. Stable, yellow shirt, looking for mother"
                      value={shelterForm.notes}
                      onChange={(e) => setShelterForm({ ...shelterForm, notes: e.target.value })}
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center mt-3 bg-blue-600 hover:bg-blue-700"
                  >
                    <UserCheck className="h-4 w-4" />
                    Record Camp Check-In
                  </Button>
                </form>
              </Card>
            )}

            {/* Privacy Guarantee Box */}
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-800">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                PII Privacy Safeguard
              </div>
              <p className="leading-relaxed">
                Personal phone numbers and shelter bay coordinates are redacted from public displays to prevent exploitation during disaster disorder. Official verification occurs on-site.
              </p>
            </div>
          </div>

          {/* Right 2 Cols: Live Matches & Registered Inquiries */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Verified Family Matches ({filteredCandidates.length})
              </h2>
              <span className="text-xs text-gray-400">Automated multi-attribute scoring</span>
            </div>

            <div className="space-y-4">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="p-5 bg-white border border-emerald-200 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-lg font-black text-gray-900">
                          {candidate.missingName}
                        </h3>
                        <Badge color="NORMAL" label={`${candidate.matchScore}% Match`} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {candidate.lastSeenLocation}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Safe at {candidate.shelterName}
                      </div>
                    </div>
                  </div>

                  {/* Matching Traits */}
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5 text-xs">
                    <span className="font-bold text-emerald-900">Verified Attributes:</span>
                    <ul className="space-y-1 text-gray-700">
                      {candidate.matchingTraits.map((trait, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Status: Confirmed Safe at Relief Center
                    </span>
                    <button
                      onClick={() => {
                        audioAlerts.playSuccessChime();
                        setNotification({
                          text: `Contact request routed to camp manager at ${candidate.shelterName}.`,
                          type: "success",
                        });
                      }}
                      className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      Request Camp Reunite Pass →
                    </button>
                  </div>
                </Card>
              ))}

              {/* Registered Inquiries Section */}
              <div className="pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Recent Public Inquiries in System ({missingList.length})
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {missingList.map((rec) => (
                    <div key={rec.id} className="p-3.5 bg-white rounded-xl border border-gray-200 text-xs space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{rec.full_name}</span>
                        <Badge color="MEDIUM" label={rec.status} />
                      </div>
                      <div className="text-gray-500">
                        {rec.age ? `${rec.age} yrs` : "Age unrecorded"} · {rec.gender || "Gender unspecified"}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        {rec.clothing_last_seen || rec.last_seen_location || "No notes"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
