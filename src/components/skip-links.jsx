"use client";

import { useEffect } from "react";

const destinations = [
  { id: "conteudo", key: "c", label: "Ir para o conteúdo" },
  { id: "rodape", key: "r", label: "Ir para o rodapé" },
];

export function SkipLinks() {
  useEffect(() => {
    function handleShortcut(event) {
      if (event.defaultPrevented || event.isComposing || event.repeat ||
          !event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey ||
          event.target.closest?.("input, textarea, select, [contenteditable]") ||
          document.querySelector("dialog:modal")) return;

      const destination = destinations.find(({ key }) => key === event.key.toLowerCase());
      const target = destination && document.getElementById(destination.id);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  return destinations.map(({ id, key, label }) => (
    <a key={id} className="skip-link" href={`#${id}`} aria-keyshortcuts={`Alt+Shift+${key.toUpperCase()}`}>
      {label}
    </a>
  ));
}
