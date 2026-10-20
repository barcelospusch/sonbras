"use client";
import { useState } from "react";
import { SunIcon, MoonIcon, AlienIcon } from "@phosphor-icons/react";
import { useApp } from "./app-provider";
export function ThemePicker() {
  const { theme, setTheme, user, profileLoading } = useApp();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const choices = [
    { id: "light", label: "Tema claro", icon: SunIcon },
    { id: "dark", label: "Tema escuro", icon: MoonIcon },
    { id: "red", label: "Tema vermelho", icon: AlienIcon },
  ];
  async function select(next) {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await setTheme(next);
    } catch {
      setError("Não foi possível salvar o tema.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="theme-picker">
      <div
        className="theme-slider"
        role="radiogroup"
        aria-label="Tema da plataforma"
        aria-busy={busy}
        style={{ "--theme-index": choices.findIndex((c) => c.id === theme) }}
      >
        <span className="theme-slider-thumb" aria-hidden="true" />
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={theme === choice.id}
            aria-label={choice.label}
            title={choice.label}
            tabIndex={theme === choice.id ? 0 : -1}
            disabled={!!user && profileLoading}
            aria-disabled={busy}
            onClick={() => select(choice.id)}
            onKeyDown={(e) => {
              const direction =
                e.key === "ArrowRight" || e.key === "ArrowDown"
                  ? 1
                  : e.key === "ArrowLeft" || e.key === "ArrowUp"
                    ? -1
                    : 0;
              if (direction) {
                e.preventDefault();
                const next = (index + direction + 3) % 3;
                const parent = e.currentTarget.parentElement;
                select(choices[next].id);
                parent?.querySelectorAll("button")[next]?.focus();
              }
            }}
          >
            <choice.icon size={19} weight="duotone" />
          </button>
        ))}
      </div>
      {error && (
        <span role="alert" className="theme-error">
          {error}
        </span>
      )}
    </div>
  );
}
