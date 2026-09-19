"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import {
  HeartPulse,
  Activity,
  Bed,
  Zap,
  Wind,
  ShieldAlert,
  Compass,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
  Navigation,
  ArrowRight,
  Stethoscope,
  Building,
} from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_icu_beds: number;
  available_icu_beds: number;
  total_general_beds: number;
  available_general_beds: number;
  oxygen_reserve_hours: number;
  generator_fuel_hours: number;
  divert_status: "NORMAL" | "CAUTION" | "DIVERT_ALL";
  contact_phone?: string;
  updated_at?: string;
}

interface DivertRecommendation {
  hospitalId: string;
  hospitalName: string;
  address: string;
  distanceKm: number;
  etaMinutes: number;
  availableIcuBeds: number;
  oxygenReserveHours: number;
  divertStatus: string;
  rationale: string;
}

export default function HospitalGridPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Divert Calculator State
  const [incidentLoc, setIncidentLoc] = useState({
    name: "Central Sector Riverbank Zone",
    lat: 22.258,
    lng: 84.835,
  });
  const [requiresIcu, setRequiresIcu] = useState(true);
  const [casualtyCount, setCasualtyCount] = useState(2);
  const [divertResult, setDivertResult] = useState<DivertRecommendation | null>(null);
  const [calculatingDivert, setCalculatingDivert] = useState(false);

  // Fetch live hospital status
  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hospitals");
      const data = await res.json();
      if (data.success && data.hospitals) {
        setHospitals(data.hospitals);
      }
    } catch (err) {
      console.error("Failed to load hospital data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Quick Bed Adjustment
  const handleAdjustBed = async (hospital: Hospital, type: "icu" | "general", delta: number) => {
    const updatedIcu = type === "icu" ? Math.max(0, hospital.available_icu_beds + delta) : hospital.available_icu_beds;
    const updatedGen = type === "general" ? Math.max(0, hospital.available_general_beds + delta) : hospital.available_general_beds;

    setUpdatingId(hospital.id);
    try {
      const res = await fetch(`/api/hospitals/${hospital.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableIcuBeds: updatedIcu,
          availableGeneralBeds: updatedGen,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHospitals((prev) =>
          prev.map((h) =>
            h.id === hospital.id
              ? { ...h, available_icu_beds: updatedIcu, available_general_beds: updatedGen }
              : h
          )
        );
      }
    } catch (err) {
      console.error("Failed to update hospital beds", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Hospital Divert Status
  const handleToggleDivert = async (hospital: Hospital, newStatus: "NORMAL" | "CAUTION" | "DIVERT_ALL") => {
    setUpdatingId(hospital.id);
    try {
      const res = await fetch(`/api/hospitals/${hospital.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divertStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setHospitals((prev) =>
          prev.map((h) => (h.id === hospital.id ? { ...h, divert_status: newStatus } : h))
        );
      }
    } catch (err) {
      console.error("Failed to update divert status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Run Divert Calculator
  const handleRunDivertCalc = async () => {
    setCalculatingDivert(true);
    try {
      const res = await fetch("/api/hospitals/divert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentLatitude: incidentLoc.lat,
          incidentLongitude: incidentLoc.lng,
          requiresIcu,
          casualtyCount,
        }),
      });
      const data = await res.json();
      if (data.success && data.recommendedDestination) {
        setDivertResult(data.recommendedDestination);
      }
    } catch (err) {
      console.error("Failed to compute divert recommendation", err);
    } finally {
      setCalculatingDivert(false);
    }
  };

  const totalIcu = hospitals.reduce((sum, h) => sum + (h.total_icu_beds || 0), 0);
  const availIcu = hospitals.reduce((sum, h) => sum + (h.available_icu_beds || 0), 0);
  const totalGen = hospitals.reduce((sum, h) => sum + (h.total_general_beds || 0), 0);
  const availGen = hospitals.reduce((sum, h) => sum + (h.available_general_beds || 0), 0);

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
              <HeartPulse className="h-4 w-4 text-red-600" />
              District Hospital ICU & Trauma Bed Telemetry
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchHospitals}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="text-xs">
                Control Room →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* District Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Facilities
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1">{hospitals.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">District trauma nodes</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />
              Available ICU Beds
            </div>
            <div className="text-2xl font-black text-red-600 mt-1">
              {availIcu}{" "}
              <span className="text-xs text-gray-400 font-normal">/ {totalIcu}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {totalIcu > 0 ? Math.round(((totalIcu - availIcu) / totalIcu) * 100) : 0}% ICU occupancy
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              General Surge Beds
            </div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {availGen}{" "}
              <span className="text-xs text-gray-400 font-normal">/ {totalGen}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Emergency triage capacity</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Divert Status
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {hospitals.filter((h) => h.divert_status === "DIVERT_ALL" || h.divert_status === "CAUTION").length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Facilities on caution / divert</div>
          </div>
        </div>

        {/* Main Content: 2-Col Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Hospital Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Live Medical Centers
            </h2>

            <div className="space-y-4">
              {hospitals.map((hosp) => {
                const isUpdating = updatingId === hosp.id;
                const icuUsage =
                  hosp.total_icu_beds > 0
                    ? Math.round(
                        ((hosp.total_icu_beds - hosp.available_icu_beds) / hosp.total_icu_beds) *
                          100
                      )
                    : 0;

                return (
                  <Card key={hosp.id} className="p-5 bg-white border border-gray-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-gray-700" />
                          <h3 className="text-base sm:text-lg font-bold text-gray-900">
                            {hosp.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{hosp.address}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          color={hosp.divert_status}
                          label={
                            hosp.divert_status === "DIVERT_ALL"
                              ? "DIVERT ACTIVE"
                              : hosp.divert_status === "CAUTION"
                              ? "STRAINED / CAUTION"
                              : "NORMAL OPERATION"
                          }
                        />

                        {/* Status Toggle dropdown */}
                        <select
                          className="h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-800 cursor-pointer"
                          value={hosp.divert_status}
                          disabled={isUpdating}
                          onChange={(e) =>
                            handleToggleDivert(hosp, e.target.value as "NORMAL" | "CAUTION" | "DIVERT_ALL")
                          }
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="CAUTION">Caution</option>
                          <option value="DIVERT_ALL">Divert All</option>
                        </select>
                      </div>
                    </div>

                    {/* Telemetry Metric Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {/* ICU Beds */}
                      <div className="p-3 bg-red-50/70 rounded-xl border border-red-100 space-y-1">
                        <div className="flex items-center justify-between text-red-900 text-xs font-semibold">
                          <span>ICU Beds</span>
                          <Activity className="h-3.5 w-3.5 text-red-600" />
                        </div>
                        <div className="text-xl font-extrabold text-red-700">
                          {hosp.available_icu_beds}{" "}
                          <span className="text-xs font-medium text-red-900/60">
                            / {hosp.total_icu_beds}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <button
                            onClick={() => handleAdjustBed(hosp, "icu", -1)}
                            disabled={isUpdating || hosp.available_icu_beds <= 0}
                            className="p-1 bg-white rounded-md border border-red-200 text-red-700 hover:bg-red-100 disabled:opacity-40 cursor-pointer"
                            title="Decrease available ICU beds"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleAdjustBed(hosp, "icu", 1)}
                            disabled={isUpdating || hosp.available_icu_beds >= hosp.total_icu_beds}
                            className="p-1 bg-white rounded-md border border-red-200 text-red-700 hover:bg-red-100 disabled:opacity-40 cursor-pointer"
                            title="Increase available ICU beds"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="text-[10px] text-red-600 ml-auto font-medium">
                            {icuUsage}% Full
                          </span>
                        </div>
                      </div>

                      {/* General Beds */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                        <div className="flex items-center justify-between text-gray-700 text-xs font-semibold">
                          <span>General Beds</span>
                          <Bed className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div className="text-xl font-extrabold text-gray-900">
                          {hosp.available_general_beds}{" "}
                          <span className="text-xs font-medium text-gray-400">
                            / {hosp.total_general_beds}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <button
                            onClick={() => handleAdjustBed(hosp, "general", -1)}
                            disabled={isUpdating || hosp.available_general_beds <= 0}
                            className="p-1 bg-white rounded-md border border-gray-200 text-gray-800 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleAdjustBed(hosp, "general", 1)}
                            disabled={
                              isUpdating || hosp.available_general_beds >= hosp.total_general_beds
                            }
                            className="p-1 bg-white rounded-md border border-gray-200 text-gray-800 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Oxygen Reserve */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                        <div className="flex items-center justify-between text-gray-700 text-xs font-semibold">
                          <span>Oxygen Reserve</span>
                          <Wind className="h-3.5 w-3.5 text-cyan-600" />
                        </div>
                        <div className="text-xl font-extrabold text-gray-900">
                          {hosp.oxygen_reserve_hours}{" "}
                          <span className="text-xs font-normal text-gray-500">hrs</span>
                        </div>
                        <div className="text-[10px] font-medium text-emerald-600 pt-1">
                          {hosp.oxygen_reserve_hours >= 12 ? "✓ Stable reserve" : "⚠️ Refill needed"}
                        </div>
                      </div>

                      {/* Generator Fuel */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                        <div className="flex items-center justify-between text-gray-700 text-xs font-semibold">
                          <span>Genset Fuel</span>
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div className="text-xl font-extrabold text-gray-900">
                          {hosp.generator_fuel_hours}{" "}
                          <span className="text-xs font-normal text-gray-500">hrs</span>
                        </div>
                        <div className="text-[10px] text-gray-500 pt-1">Aux power ready</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right 1 Col: Interactive Casualty Divert Calculator */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Emergency Divert Calculator
            </h2>

            <Card className="p-5 space-y-5 bg-white shadow-xs border border-gray-200">
              <div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-red-600" />
                  <h3 className="font-bold text-gray-900">Ambulance Routing Dispatcher</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Autonomous triage destination calculator balancing ambulance ETA, live ICU capacity, and hospital divert penalties.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Casualty Pick-up Zone
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={incidentLoc.name}
                    onChange={(e) => {
                      if (e.target.value.includes("Riverbank")) {
                        setIncidentLoc({ name: e.target.value, lat: 22.258, lng: 84.835 });
                      } else if (e.target.value.includes("Highway")) {
                        setIncidentLoc({ name: e.target.value, lat: 22.241, lng: 84.815 });
                      } else {
                        setIncidentLoc({ name: e.target.value, lat: 22.225, lng: 84.855 });
                      }
                    }}
                  >
                    <option value="Central Sector Riverbank Zone">Central Riverbank (High Water Inundation)</option>
                    <option value="Main Highway Expressway Junction">Main Highway Expressway Junction</option>
                    <option value="Downtown Residential Ward">Downtown Residential Ward</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Casualties
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={casualtyCount}
                      onChange={(e) => setCasualtyCount(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer text-xs font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={requiresIcu}
                        onChange={(e) => setRequiresIcu(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>Needs ICU</span>
                    </label>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center mt-2"
                  onClick={handleRunDivertCalc}
                  disabled={calculatingDivert}
                >
                  <Compass className={`h-4 w-4 ${calculatingDivert ? "animate-spin" : ""}`} />
                  {calculatingDivert ? "Calculating Destination..." : "Compute Optimal Hospital"}
                </Button>
              </div>

              {/* Recommendation Result */}
              {divertResult && (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Recommended Hospital
                    </span>
                    <Badge color="NORMAL" label={`${divertResult.distanceKm} km · ${divertResult.etaMinutes}m ETA`} />
                  </div>

                  <div>
                    <div className="text-base font-extrabold text-gray-900">
                      {divertResult.hospitalName}
                    </div>
                    <div className="text-xs text-gray-500">{divertResult.address}</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs text-gray-800 leading-relaxed">
                    <span className="font-bold text-red-600">AI Dispatch Rationale: </span>
                    {divertResult.rationale}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-500">Confirmed Bed Availability:</span>
                    <span className="font-bold text-emerald-700">
                      {divertResult.availableIcuBeds} ICU beds ready
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
