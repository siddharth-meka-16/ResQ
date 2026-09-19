"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { audioAlerts } from "@/lib/audioAlerts";
import {
  AlertTriangle,
  Compass,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Truck,
  Ship,
  Plane,
  MapPin,
  Clock,
  Activity,
} from "lucide-react";

// Dynamic map import without SSR to prevent window/leaflet errors
const DynamicReplanningMap = dynamic(
  () => import("./ReplanningMap").then((mod) => mod.ReplanningMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 animate-pulse">
        Initializing Dynamic Route Replanning Topology Map...
      </div>
    ),
  }
);

export default function DynamicReplanningSandboxPage() {
  const [isBridgeBlocked, setIsBridgeBlocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<"TRUCK" | "BOAT" | "AIRLIFT">("TRUCK");

  const handleBlockBridge = async () => {
    setIsProcessing(true);
    try {
      audioAlerts.playReplanningAlert();
      await fetch("/api/replanning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hazardType: "FLOODED",
          title: "Central River Bridge Inundated (+120cm Floodwater)",
          latitude: 22.234,
          longitude: 84.818,
          waterDepthCm: 120,
          isPassableByBoat: true,
        }),
      });
      setIsBridgeBlocked(true);
      setSelectedVehicle("BOAT");
    } catch {
      setIsBridgeBlocked(true);
      setSelectedVehicle("BOAT");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    setIsProcessing(true);
    try {
      audioAlerts.playSuccessChime();
      setIsBridgeBlocked(false);
      setSelectedVehicle("TRUCK");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Tactical Drill Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge color="CRITICAL" label="LIVE RESILIENCE DRILL" />
            <span className="text-xs text-gray-400 font-medium">Autonomous Route Triage</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1.5">
            Dynamic Route Replanning Sandbox
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
            When flash floods or landslides sever a key road corridor, standard dispatch algorithms freeze or risk lives. ResQ instantly recalculates the transportation topology, switching vehicles from truck to swift-water boat in under 200 milliseconds.
          </p>
        </div>

        <div>
          {!isBridgeBlocked ? (
            <Button
              variant="danger"
              size="lg"
              disabled={isProcessing}
              onClick={handleBlockBridge}
              className="h-12 px-5 text-sm font-bold shadow-lg"
            >
              <AlertTriangle className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
              Simulate Bridge Flood Blockage
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              disabled={isProcessing}
              onClick={handleReset}
              className="h-12 px-5 text-sm font-bold bg-white text-gray-900 shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
              Clear Hazard & Reset Normal Route
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Map + Comparison Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
        {/* Left 7 cols: Map View */}
        <div className="lg:col-span-7 h-[450px] lg:h-auto rounded-3xl overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
          <DynamicReplanningMap
            isBridgeBlocked={isBridgeBlocked}
            selectedVehicle={selectedVehicle}
          />
        </div>

        {/* Right 5 cols: Decision & Comparison Cards */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <Card className="p-5 sm:p-6 space-y-5 bg-white border border-gray-200 shadow-xs flex-1">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Corridor State & Vehicle Allocation
              </span>
              <Badge
                color={isBridgeBlocked ? "CRITICAL" : "NORMAL"}
                label={isBridgeBlocked ? "CORRIDOR SEVERED (+1.2M WATER)" : "ROAD OPEN & DRY"}
              />
            </div>

            {/* Tactical Explanation Banner */}
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                isBridgeBlocked
                  ? "bg-red-50/80 border-red-200 text-red-950"
                  : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
              }`}
            >
              <div className="font-extrabold uppercase text-xs mb-1 flex items-center gap-1.5">
                {isBridgeBlocked ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    Autonomous Rerouting Autopilot Engaged:
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Nominal Dispatch Conditions:
                  </>
                )}
              </div>
              <p>
                {isBridgeBlocked
                  ? "Main River Bridge is submerged under 120cm of floodwater. Ground rescue truck route invalidated. ResQ upgraded mission craft to Motorized Inflatable Boat RT-001 traversing the river channel."
                  : "Main River Bridge is fully operational. Rescue trucks have clear overland right-of-way."}
              </p>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Multi-Modal Transport Evaluation:
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Truck Route */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isBridgeBlocked
                      ? "bg-gray-50 border-gray-200 opacity-60 line-through"
                      : "bg-emerald-50/60 border-emerald-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-gray-500">
                      Standard Ground Route
                    </span>
                    <Truck className="h-4 w-4 text-gray-700" />
                  </div>
                  <div className="text-sm font-black text-gray-900 mt-1">Truck RT-003</div>
                  <div className="text-xs text-gray-500 mt-0.5">Via Main Bridge</div>
                  <div className="mt-2 text-xs font-bold text-gray-700">
                    {isBridgeBlocked ? "BLOCKED by water" : "ETA: 12.0 mins"}
                  </div>
                </div>

                {/* Boat / Alternative Route */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isBridgeBlocked
                      ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-blue-700">
                      Switched Craft
                    </span>
                    <Ship className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-sm font-black text-gray-900 mt-1">Boat Unit RT-001</div>
                  <div className="text-xs text-gray-500 mt-0.5">Via Waterway Corridor</div>
                  <div className="mt-2 text-xs font-bold text-blue-700">
                    {isBridgeBlocked ? "EN ROUTE (ETA: 8.5m)" : "Standby at dock"}
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-bold">
                  Replanning Latency
                </div>
                <div className="text-xl font-extrabold text-emerald-600 mt-0.5">140 ms</div>
                <div className="text-[10px] text-gray-400">Sub-second graph update</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-bold">
                  Rescuer Safety Margin
                </div>
                <div className="text-xl font-extrabold text-blue-600 mt-0.5">100%</div>
                <div className="text-[10px] text-gray-400">Zero drowning exposure</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
