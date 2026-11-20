"use client";
import { ShareNetworkIcon } from "@phosphor-icons/react";
import { useState } from "react";
import toast from "react-hot-toast";

export function CopyProfileLink({ profile, children }) {
  const [result, setResult] = useState(null);
  const canShare = profile.isPublic && profile.username;
  if (!canShare) return children ?? null;
  const feedback = result?.username === profile.username ? result : null;

  async function copy() {
    const url = new URL(
      `/users/${encodeURIComponent(profile.username)}`,
      window.location.origin,
    ).href;
    try {
      await navigator.clipboard.writeText(url);
      setResult(null);
      toast.success("Link do perfil copiado.", { id: "copy-profile-link" });
    } catch {
      setResult({ username: profile.username, url });
      toast.error("Use o campo exibido para copiar o link.", {
        id: "copy-profile-link",
      });
    }
  }

  return (
    <div className="copy-profile-link">
      <div className="share-actions">
        {children}
        <button type="button" className="button secondary" onClick={copy}>
          <ShareNetworkIcon size={17} weight="duotone" /> Copiar link
        </button>
      </div>
      {feedback?.url && (
        <label>
          Copie o endereço do perfil
          <input
            type="text"
            readOnly
            value={feedback.url}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      )}
    </div>
  );
}
