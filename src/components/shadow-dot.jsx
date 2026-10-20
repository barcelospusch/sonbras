"use client";
import { useEffect, useState } from "react";
const labels = {
  shadow: "Dentro da sombra nominal",
  sigma: "Fora da sombra nominal, dentro da faixa de 1σ",
  outside: "Fora da faixa de 1σ",
  unknown: "Classificação indisponível",
};
export function ShadowDot({ id, latitude, longitude, showLabel = false }) {
  const [status, setStatus] = useState("unknown"),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setStatus("unknown");
    fetch(
      `/api/events/${encodeURIComponent(id)}/visibility?latitude=${latitude}&longitude=${longitude}`,
      { signal: c.signal },
    )
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.shadowStatus in labels ? data.shadowStatus : "unknown");
        setLoading(false);
      })
      .catch(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [id, latitude, longitude]);
  const label = loading ? "Calculando faixa da sombra…" : labels[status];
  const dot = (
    <span
      className={`shadow-dot shadow-${loading ? "loading" : status}`}
      role="img"
      aria-label={label}
      title={label}
    />
  );
  return showLabel ? (
    <span className="shadow-indicator">
      {dot}
      <span>{label}</span>
    </span>
  ) : (
    dot
  );
}
export function ShadowLegend() {
  return (
    <div className="shadow-legend">
      <span>
        <i className="shadow-dot shadow-shadow" />
        Dentro da sombra
      </span>
      <span>
        <i className="shadow-dot shadow-sigma" />
        Dentro de 1σ
      </span>
      <span>
        <i className="shadow-dot shadow-outside" />
        Fora de 1σ
      </span>
      <span>
        <i className="shadow-dot shadow-unknown" />
        Sem dados
      </span>
    </div>
  );
}
