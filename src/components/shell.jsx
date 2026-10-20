"use client";
import {
  ArrowUpRightIcon,
  BinocularsIcon,
  CompassIcon,
  InfoIcon,
  MapPinIcon,
  PlanetIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./app-provider";
import { ThemePicker } from "./theme-picker";
export function Shell({ children }) {
  const { user, profile, logout } = useApp();
  const path = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <PlanetIcon weight="duotone" size={32} />
          </span>
          sonbras<span className="brand-dot">.</span>
        </Link>
        <div className="sidebar-label">SEU OBSERVATÓRIO</div>
        <nav>
          <Link
            className={
              path === "/" || path.startsWith("/sites")
                ? "nav-item active"
                : "nav-item"
            }
            href="/"
          >
            <MapPinIcon weight="duotone" size={21} />
            Meus sítios <span className="nav-dot" />
          </Link>
          <Link
            className={`nav-item ${path === "/guide" ? "active" : ""}`}
            href="/guide"
          >
            <CompassIcon weight="duotone" size={21} />
            Guia de observação
          </Link>
          <Link
            className={`nav-item ${path === "/about" ? "active" : ""}`}
            href="/about"
          >
            <InfoIcon weight="duotone" size={21} />
            Sobre a plataforma
          </Link>
          <Link
            className={`nav-item ${path === "/account" ? "active" : ""}`}
            href="/account"
          >
            <UserCircleIcon weight="duotone" size={21} />
            Minha conta
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <span className="online-dot" /> PREDIÇÕES VIA LIneA{" "}
          <small>Sonbras · v0.2.1</small>
        </div>
      </aside>
      <div className="main-wrapper">
        <header className="topbar">
          <span>
            <BinocularsIcon size={18} weight="duotone" /> PLANEJE. OBSERVE.
            DESCUBRA.
          </span>
          <div>
            <ThemePicker />
            {user ? (
              <>
                <Link
                  href={`/users/${profile.username}`}
                  className="user-avatar"
                  aria-label="Minha conta"
                >
                  {(
                    profile.displayName ||
                    user.displayName ||
                    user.email ||
                    "O"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </Link>
                <Link href={`/users/${profile.username}`} className="user-name">
                  {profile.displayName || user.displayName || user.email}
                </Link>
                <button
                  className="icon-button"
                  aria-label="Sair da conta"
                  onClick={() =>
                    logout().catch(() =>
                      window.alert("Não foi possível sair. Tente novamente."),
                    )
                  }
                >
                  <SignOutIcon size={20} />
                </button>
              </>
            ) : (
              <Link className="text-link" href="/login">
                Acessar minha conta <ArrowUpRightIcon size={16} />
              </Link>
            )}
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <span>
            sonbras.{" "}
            <span className="muted">Feito para quem olha para cima.</span>
          </span>
          <span>
            Dados astronômicos por{" "}
            <a
              href="https://solarsystem.linea.org.br"
              target="_blank"
              rel="noreferrer"
            >
              LIneA ↗
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
