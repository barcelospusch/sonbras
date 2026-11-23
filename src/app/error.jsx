"use client";
import { Shell } from "@/components/shell";

export default function ErrorPage({ reset }) {
  return (
    <Shell>
      <div className="empty-state">
        <h1>Uma pausa na observação.</h1>
        <p>Não foi possível carregar esta página.</p>
        <button className="button" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </Shell>
  );
}
