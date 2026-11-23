"use client";
import {
  CompassIcon,
  GearIcon,
  InfoIcon,
  ListIcon,
  MapPinIcon,
  PlanetIcon,
  ShieldCheckIcon,
  SignInIcon,
  SignOutIcon,
  UserCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useApp } from "./app-provider";
import { CookieNoticeButton } from "./cookie-notice";
import { ThemePicker } from "./theme-picker";

const mainLinks = [
  { href: "/", label: "Sítios", icon: MapPinIcon },
  { href: "/guide", label: "Guia", icon: CompassIcon },
  { href: "/about", label: "Sobre", icon: InfoIcon },
];
const adminLink = { href: "/admin", label: "Administração", icon: ShieldCheckIcon };

function TopNav({ path }) {
  const { user, profile, logout } = useApp();
  const [expanded, setExpanded] = useState(false);
  const headerRef = useRef(null);
  const toggleRef = useRef(null);
  const panelId = useId();
  const links = user && profile.isAdmin === true ? [...mainLinks, adminLink] : mainLinks;
  const profileHref = profile.username && `/users/${encodeURIComponent(profile.username)}`;
  const profileName = profile.displayName || user?.displayName || profile.username;

  useEffect(() => {
    if (!expanded) return;
    function closeOnOutsidePointer(event) {
      if (!headerRef.current?.contains(event.target)) setExpanded(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [expanded]);

  function closeMenu() {
    if (expanded && toggleRef.current?.getClientRects().length) toggleRef.current.focus();
    setExpanded(false);
  }

  return (
    <header
      className="top-nav"
      ref={headerRef}
      onKeyDown={(event) => {
        if (event.key === "Escape" && expanded && toggleRef.current?.getClientRects().length) {
          event.preventDefault();
          closeMenu();
        }
      }}
      onBlur={(event) => {
        if (expanded && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          setExpanded(false);
        }
      }}
    >
      <div className="top-nav-inner">
        <Link href="/" className="brand" aria-label="Sonbras, início" onNavigate={closeMenu}>
          <span className="brand-icon"><PlanetIcon weight="duotone" size={26} aria-hidden="true" /></span>
          <span>sonbras<span className="brand-dot">.</span></span>
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="top-nav-toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? <XIcon size={21} aria-hidden="true" /> : <ListIcon size={21} aria-hidden="true" />}
          {expanded ? "Fechar" : "Menu"}
        </button>
        <div className="top-nav-panel" id={panelId} data-expanded={expanded}>
          <nav className="top-nav-links" aria-label="Navegação principal">
            {links.map(({ href, label, icon: Icon }) => {
              const current = path === href
                ? "page"
                : path.startsWith(href === "/" ? "/sites/" : `${href}/`) ? "location" : undefined;
              return (
                <Link key={href} href={href} className="top-nav-link" aria-current={current} onNavigate={closeMenu}>
                  <Icon size={18} weight="duotone" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="top-nav-actions">
            <div className="top-nav-theme">
              <span className="top-nav-theme-label">Tema</span>
              <ThemePicker />
            </div>
            <div className="top-nav-session">
              {user ? (
                <>
                  {profileHref && (
                    <Link href={profileHref} className="top-nav-link top-nav-profile" aria-current={path === profileHref ? "page" : undefined} onNavigate={closeMenu}>
                      <UserCircleIcon size={21} weight="duotone" aria-hidden="true" />
                      <span>{profileName}</span>
                    </Link>
                  )}
                  <Link href="/account" className="top-nav-link top-nav-account" aria-label="Minha conta" title="Minha conta"
                    aria-current={path === "/account" ? "page" : undefined} onNavigate={closeMenu}>
                    <GearIcon size={20} weight="duotone" aria-hidden="true" />
                    <span className="top-nav-action-label">Minha conta</span>
                  </Link>
                  <button type="button" className="top-nav-link top-nav-logout" aria-label="Sair da conta" title="Sair da conta"
                    onClick={() => logout().then(closeMenu).catch(() => toast.error("Não foi possível sair. Tente novamente."))}>
                    <SignOutIcon size={20} aria-hidden="true" />
                    <span className="top-nav-action-label">Sair da conta</span>
                  </button>
                </>
              ) : (
                <Link className="top-nav-link top-nav-signin" href="/login" aria-current={path === "/login" ? "page" : undefined} onNavigate={closeMenu}>
                  <SignInIcon size={20} aria-hidden="true" /> Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Shell({ children }) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <TopNav key={path} path={path} />
      <main className="main-wrapper" id="conteudo" tabIndex={-1}>{children}</main>
      <footer id="rodape" tabIndex={-1}>
        <span>sonbras.<span className="muted">Feito para quem olha para cima.</span></span>
        <nav className="footer-links" aria-label="Políticas e termos">
          <Link href="/politica-de-privacidade">Política de Privacidade</Link>
          <Link href="/termos-de-uso">Termos de Uso</Link>
          <Link href="/politica-de-cookies">Política de Cookies</Link>
          <CookieNoticeButton />
        </nav>
        <span>Dados astronômicos por <a href="https://solarsystem.linea.org.br" target="_blank" rel="noreferrer">LIneA ↗</a></span>
      </footer>
    </div>
  );
}
