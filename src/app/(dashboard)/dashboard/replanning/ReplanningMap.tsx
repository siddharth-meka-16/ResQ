"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_CENTER: [number, number] = [22.242, 84.825];

// Custom icons
const truckIcon = L.divIcon({
  className: "",
  html: `<div style="background:#2563eb;color:white;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const boatIcon = L.divIcon({
  className: "",
  html: `<div style="background:#0891b2;color:white;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const hazardIcon = L.divIcon({
  className: "",
  html: `<div style="background:#dc2626;color:white;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 0 12px rgba(220,38,38,0.8);display:flex;align-items:center;justify-content:center;" class="animate-ping">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const rescueTargetIcon = L.divIcon({
  className: "",
  html: `<div style="background:#ea580c;color:white;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface ReplanningMapProps {
  isBridgeBlocked: boolean;
  selectedVehicle: "TRUCK" | "BOAT" | "AIRLIFT";
}

export function ReplanningMap({ isBridgeBlocked, selectedVehicle }: ReplanningMapProps) {
  // Primary direct route across bridge
  const primaryRoute: [number, number][] = [
    [22.222, 84.81],  // Station 1
    [22.234, 84.818], // Bridge bottleneck
    [22.2532, 84.8315] // Flood Rescue Site
  ];

  // Riverboat waterway alternative corridor
  const riverBoatRoute: [number, number][] = [
    [22.222, 84.81],   // Staging Dock
    [22.238, 84.812],  // River Entrance
    [22.247, 84.821],  // Navigable Waterway
    [22.2532, 84.8315] // Direct rooftop extraction point
  ];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={MAP_CENTER}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Primary Overland Path */}
        <Polyline
          positions={primaryRoute}
          color={isBridgeBlocked ? "#9ca3af" : "#2563eb"}
          weight={4}
          dashArray={isBridgeBlocked ? "6, 8" : undefined}
          opacity={isBridgeBlocked ? 0.4 : 0.9}
        />

        {/* Dynamic Waterway Path when blocked */}
        {isBridgeBlocked && (
          <Polyline
            positions={riverBoatRoute}
            color="#0891b2"
            weight={5}
            opacity={0.9}
          />
        )}

        {/* Vehicle Marker */}
        <Marker
          position={isBridgeBlocked ? [22.238, 84.812] : [22.222, 84.81]}
          icon={isBridgeBlocked ? boatIcon : truckIcon}
        >
          <Popup>
            <div className="text-xs p-1">
              <b>{isBridgeBlocked ? "Boat RT-001" : "Truck RT-003"}</b>
              <p>{isBridgeBlocked ? "Traversing river corridor" : "En route via bridge"}</p>
            </div>
          </Popup>
        </Marker>

        {/* Rescue Incident Target */}
        <Marker position={[22.2532, 84.8315]} icon={rescueTargetIcon}>
          <Popup>
            <div className="text-xs p-1">
              <b>Rooftop Rescue Site</b>
              <p>8 people trapped by rising floodwater</p>
            </div>
          </Popup>
        </Marker>

        {/* Hazard Marker at the Bridge */}
        {isBridgeBlocked && (
          <>
            <Marker position={[22.234, 84.818]} icon={hazardIcon}>
              <Popup>
                <div className="text-xs p-1 text-red-700">
                  <b>Bridge Inundated</b>
                  <p>120cm water depth. Overland vehicular passage blocked.</p>
                </div>
              </Popup>
            </Marker>
            <CircleMarker
              center={[22.234, 84.818]}
              radius={35}
              pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.3 }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-gray-200 text-[11px] shadow-md space-y-1">
        <div className="font-bold text-gray-700">Topology Status:</div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-1 inline-block rounded"
            style={{ backgroundColor: isBridgeBlocked ? "#9ca3af" : "#2563eb" }}
          />
          <span>Overland Highway {isBridgeBlocked ? "(Severed)" : "(Active)"}</span>
        </div>
        {isBridgeBlocked && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 inline-block rounded bg-cyan-600" />
            <span className="text-cyan-800 font-semibold">Swift-water Boat Corridor</span>
          </div>
        )}
      </div>
    </div>
  );
}
