"use client";
import Link from "next/link";
import { Shell } from "./shell";
import { useApp } from "./app-provider";

export function AdminArea({ children }) {
  const { user, profile, loading, profileLoading } = useApp();
  return (
    <Shell>
      {loading || profileLoading ? (
        <p role="status">Verificando acesso…</p>
      ) : user && profile.isAdmin === true ? (
        <div key={user.uid}>{children}</div>
      ) : (
        <div className="empty-state">
          <h1>Acesso restrito</h1>
          <p>Esta área é exclusiva para administradores.</p>
          <Link className="button" href={user ? "/" : "/login"}>
            {user ? "Voltar ao início" : "Entrar"}
          </Link>
        </div>
      )}
    </Shell>
  );
}
