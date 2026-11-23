"use client";

import Link from "next/link";
import { useEffect } from "react";
import toast, { resolveValue, useToaster } from "react-hot-toast/headless";

const noticeId = "aviso-de-cookies";
const storageKey = "sonbras.cookie-notice.v1";

function closeNotice(remember, returnFocus) {
  if (remember) {
    try {
      window.localStorage.setItem(storageKey, "acknowledged");
    } catch {
      // The notice can still be closed when browser storage is blocked.
    }
  }
  (returnFocus?.isConnected ? returnFocus : document.getElementById("conteudo"))?.focus();
  toast.remove(noticeId, noticeId);
}

function showNotice(returnFocus) {
  toast.custom((item) => (
    <section className="cookie-notice" aria-labelledby={`${noticeId}-titulo`}>
      <h2 id={`${noticeId}-titulo`} tabIndex={-1} ref={returnFocus ? (node) => node?.focus() : undefined}>
        Aviso de cookies
      </h2>
      <p {...item.ariaProps}>
        Usamos armazenamento no navegador para manter sua sessão e lembrar se você leu este aviso.
      </p>
      <div className="cookie-notice-actions">
        <button type="button" className="button" onClick={() => closeNotice(true, returnFocus)}>
          Entendi
        </button>
        <button type="button" className="button secondary" onClick={() => closeNotice(false, returnFocus)}>
          Agora não
        </button>
        <Link href="/politica-de-cookies">Política de Cookies</Link>
      </div>
    </section>
  ), { id: noticeId, toasterId: noticeId, duration: Infinity });
}

export function CookieNotice() {
  const { toasts } = useToaster(undefined, noticeId);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) === "acknowledged") return;
    } catch {
      // Show the notice even when browser storage is blocked.
    }
    showNotice();
  }, []);

  return toasts.map((item) => item.visible && (
    <div key={item.id} className="cookie-notice-wrapper">
      {resolveValue(item.message, item)}
    </div>
  ));
}

export function CookieNoticeButton() {
  return (
    <button type="button" className="cookie-notice-link" onClick={(event) => showNotice(event.currentTarget)}>
      Aviso de cookies
    </button>
  );
}
