"use client";
import { ArrowUpRightIcon, GearIcon, PlanetIcon, SignOutIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./app-provider";
import { ThemePicker } from "./theme-picker";

export function Shell({ children }) {
  const { user, profile, logout } = useApp();
  const path = usePathname();
  const links = [
    { href: "/", label: "Sítios", active: path === "/" || path.startsWith("/sites/") },
    { href: "/guide", label: "Guia", active: path === "/guide" },
    { href: "/about", label: "Sobre", active: path === "/about" },
  ];
  if (user && profile.isAdmin === true)
    links.push({ href: "/admin", label: "Administração", active: path === "/admin" || path.startsWith("/admin/") });
  const profileHref = profile.username ? `/users/${profile.username}` : "/account";
  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="brand" aria-label="Sonbras, início">
            <span className="brand-icon"><PlanetIcon weight="duotone" size={28} /></span>
            sonbras<span className="brand-dot">.</span>
          </Link>
          <nav className="top-nav-links" aria-label="Navegação principal">
            {links.map(({ href, label, active }) => (
              <Link key={href} href={href} className={active ? "nav-item active" : "nav-item"} aria-current={active ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="top-nav-actions">
            <ThemePicker />
            {user ? (
              <>
                {profile.username && (
                  <Link href={profileHref} className="top-nav-profile">
                    {profile.displayName || user.displayName || profile.username}
                  </Link>
                )}
                <Link href="/account" className="icon-button" aria-label="Configurações da conta" title="Configurações da conta">
                  <GearIcon size={20} weight="duotone" />
                </Link>
                <button type="button" className="icon-button" aria-label="Sair da conta" title="Sair da conta"
                  onClick={() => logout().catch(() => window.alert("Não foi possível sair. Tente novamente."))}
                >
                  <SignOutIcon size={20} />
                </button>
              </>
            ) : (
              <Link className="text-link" href="/login">Entrar <ArrowUpRightIcon size={16} /></Link>
            )}
          </div>
        </div>
      </header>
      <main className="main-wrapper">{children}</main>
      <footer>
        <span>sonbras.<span className="muted">Feito para quem olha para cima.</span></span>
        <span>Dados astronômicos por <a href="https://solarsystem.linea.org.br" target="_blank" rel="noreferrer">LIneA ↗</a></span>
      </footer>
    </div>
  );
}
