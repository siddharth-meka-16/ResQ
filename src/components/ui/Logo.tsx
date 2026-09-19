import React from "react";

export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="ResQ Logo"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
      {/* Active pulse glow */}
      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
    </div>
  );
}
