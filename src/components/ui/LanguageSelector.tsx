"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation, SUPPORTED_LANGUAGES } from "@/context/LanguageContext";
import { Locale } from "@/types/i18n";

const LANG_FLAGS: Record<string, string> = {
  en: "🌐",
  hi: "🇮🇳",
};

interface LanguageSelectorProps {
  variant?: "pill" | "compact";
  className?: string;
}

export function LanguageSelector({
  variant = "pill",
  className = "",
}: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === locale) ?? SUPPORTED_LANGUAGES[0];

  // ── Compact dropdown ────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          id="lang-compact-btn"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          title={`Language: ${currentLang.nativeName}`}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-95"
        >
          <span className="text-sm leading-none">{LANG_FLAGS[locale]}</span>
          <span>{currentLang.shortLabel}</span>
          <svg
            className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dropdown panel */}
        <div
          role="listbox"
          aria-label="Select language"
          className={`absolute right-0 top-full z-[3000] mt-1.5 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-2xl transition-all duration-200 origin-top-right ${
            isOpen
              ? "scale-100 opacity-100 pointer-events-auto"
              : "scale-95 opacity-0 pointer-events-none"
          }`}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Language / भाषा / ଭାଷା
            </p>
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const selected = lang.code === locale;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLocale(lang.code as Locale);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? "bg-blue-50 text-[var(--color-accent)]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-base leading-none">{LANG_FLAGS[lang.code]}</span>
                <span className="flex-1">
                  <span
                    className={`block text-sm leading-tight ${selected ? "font-bold" : "font-medium"}`}
                  >
                    {lang.nativeName}
                  </span>
                  <span className="block text-[10px] text-gray-400">{lang.label}</span>
                </span>
                {selected && (
                  <svg
                    className="h-4 w-4 shrink-0 text-[var(--color-accent)]"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8l3.5 3.5L13 5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Pill / segmented control ────────────────────────────────────────────
  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center gap-0.5 rounded-xl border border-[var(--color-border)] bg-gray-100/70 p-1 ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const selected = lang.code === locale;
        return (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code as Locale)}
            title={lang.label}
            aria-pressed={selected}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 select-none ${
              selected
                ? "bg-white text-[var(--color-accent)] font-semibold shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            }`}
            style={{
              boxShadow: selected
                ? "0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(59,130,246,0.08)"
                : undefined,
            }}
          >
            <span className="text-[13px] leading-none">{LANG_FLAGS[lang.code]}</span>
            <span>{lang.nativeName}</span>
          </button>
        );
      })}
    </div>
  );
}

