"use client";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { useApp } from "@/components/app-provider";
import { ObservationList } from "@/components/observation-list";
import { Shell } from "@/components/shell";
import { ThemePicker } from "@/components/theme-picker";
import { auth } from "@/lib/firebase";
import { normalizeUsername, validUsername } from "@/lib/username.mjs";
import { FloppyDiskIcon, ShareNetworkIcon } from "@phosphor-icons/react";

export default function Account() {
  const {
    user,
    profile,
    profileLoading,
    profileError,
    loading,
    observations,
    refreshUser,
  } = useApp();
  const [values, setValues] = useState({
    displayName: "",
    institution: "",
    username: "",
    isPublic: false,
  });
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [reauth, setReauth] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [copy, setCopy] = useState("");
  useEffect(() => {
    setValues({
      displayName: profile.displayName || user?.displayName || "",
      institution: profile.institution,
      username: profile.username,
      isPublic: profile.isPublic,
    });
  }, [
    profile.displayName,
    profile.institution,
    profile.username,
    profile.isPublic,
    user?.displayName,
  ]);
  useEffect(() => {
    setEmail(user?.email || "");
  }, [user?.email]);
  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user || !auth?.currentUser) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const username = normalizeUsername(values.username);
      if (!validUsername(username))
        throw new Error(
          "Use de 3 a 30 caracteres: letras minúsculas, números, hífen ou sublinhado. Comece e termine com letra ou número.",
        );
      const data = {
        displayName: values.displayName.trim(),
        institution: values.institution.trim(),
        username,
        isPublic: values.isPublic,
      };
      if (!data.displayName) throw new Error("Informe seu nome.");
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Não foi possível salvar o perfil.");
      try {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName,
        });
        await refreshUser();
        setNotice("Perfil salvo.");
      } catch {
        setNotice(
          "Perfil salvo no Sonbras. O nome de exibição no login será sincronizado quando você entrar novamente.",
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      setError(message || "Não foi possível salvar o perfil. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function changeEmail(e: FormEvent) {
    e.preventDefault();
    const current = auth?.currentUser;
    if (!current) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (reauth) {
        if (current.providerData.some((p) => p.providerId === "password"))
          await reauthenticateWithCredential(
            current,
            EmailAuthProvider.credential(current.email || "", password),
          );
        else await reauthenticateWithPopup(current, new GoogleAuthProvider());
      }
      await verifyBeforeUpdateEmail(current, email.trim());
      setPassword("");
      setReauth(false);
      setNotice(
        "Enviamos uma confirmação para o novo e-mail. Abra o link recebido para concluir a alteração e depois atualize sua sessão.",
      );
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/requires-recent-login") {
        setReauth(true);
        setError("Confirme sua identidade abaixo para alterar o e-mail.");
      } else if (code === "auth/email-already-in-use")
        setError("Este e-mail já está sendo usado por outra conta.");
      else if (code === "auth/invalid-credential")
        setError(
          "Não foi possível confirmar sua identidade. Verifique sua senha.",
        );
      else
        setError(
          "Não foi possível enviar a confirmação. Verifique o e-mail e tente novamente.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="page-heading">
        <span className="eyebrow">SEU OBSERVATÓRIO, DO SEU JEITO</span>
        <h1>
          Minha conta<span className="accent">.</span>
        </h1>
        <p>
          Atualize seu perfil, escolha seu tema e compartilhe suas observações.
        </p>
      </div>
      {loading || profileLoading ? (
        <div className="empty-state">
          <span className="loader" />
          Carregando sua conta…
        </div>
      ) : !user ? (
        <div className="empty-state">
          <h2>Entre para cuidar do seu perfil</h2>
          <Link href="/login" className="button">
            Acessar minha conta
          </Link>
        </div>
      ) : (
        <>
          {(error || profileError) && (
            <p className="error" role="alert">
              {error || profileError}
            </p>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <div className="account-grid">
            <section className="detail-panel">
              <h2>Perfil do observador</h2>
              <form onSubmit={saveProfile}>
                <label>
                  Nome
                  <input
                    required
                    maxLength={100}
                    autoComplete="name"
                    value={values.displayName}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, displayName: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Username
                  <input
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    pattern="[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]"
                    placeholder="seu_username"
                    value={values.username}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        username: e.target.value.toLowerCase(),
                      }))
                    }
                  />
                </label>
                <p className="field-hint username-preview">
                  Seu link: /users/{values.username || "seu_username"}. Alterar
                  o username libera o anterior e muda seu link.
                </p>
                <label>
                  Instituição
                  <input
                    maxLength={150}
                    autoComplete="organization"
                    placeholder="Instituição, observatório ou independente"
                    value={values.institution}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, institution: e.target.value }))
                    }
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={values.isPublic}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, isPublic: e.target.checked }))
                    }
                  />{" "}
                  Ativar meu perfil público
                </label>
                <p className="field-hint">
                  Ao ativar, seu nome, instituição, tags e nomes dos sítios
                  marcados ficam visíveis no link compartilhado. Seu e-mail e as
                  coordenadas dos sítios permanecem privados.
                </p>
                <button className="button" disabled={busy || !!profileError}>
                  <FloppyDiskIcon weight="duotone" size={18} />
                  {busy ? "Salvando…" : "Salvar perfil"}
                </button>
              </form>
            </section>
            <div>
              <section className="detail-panel">
                <h2>Aparência</h2>
                <p className="field-hint">
                  Seu tema é salvo na sua conta e acompanha você em outros
                  dispositivos.
                </p>
                <ThemePicker />
              </section>
              <section className="detail-panel">
                <h2>Compartilhar meu céu</h2>
                <p className="field-hint">
                  {profile.isPublic
                    ? "Seu perfil está público. Compartilhe seus eventos marcados com outros observadores."
                    : "Ative e salve seu perfil público para compartilhar suas marcações."}
                </p>
                <div className="share-actions">
                  {profile.username && (
                    <Link
                      className="button secondary"
                      href={`/users/${profile.username}`}
                    >
                      Ver meu perfil
                    </Link>
                  )}
                  <button
                    className="button secondary"
                    disabled={!profile.isPublic || !profile.username}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${window.location.origin}/users/${profile.username}`,
                        );
                        setCopy("Link copiado.");
                      } catch {
                        setCopy(
                          `Copie o link: ${window.location.origin}/users/${profile.username}`,
                        );
                      }
                    }}
                  >
                    <ShareNetworkIcon size={17} weight="duotone" />
                    Copiar link
                  </button>
                </div>
                {copy && (
                  <p role="status" className="field-hint">
                    {copy}
                  </p>
                )}
              </section>
            </div>
          </div>
          <section className="detail-panel email-panel">
            <h2>E-mail da conta</h2>
            <p className="field-hint">
              A alteração só é concluída após a confirmação no novo endereço.
            </p>
            <form onSubmit={changeEmail}>
              <label>
                Novo e-mail
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {reauth &&
                user.providerData.some((p) => p.providerId === "password") && (
                  <label>
                    Confirme sua senha atual
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                )}
              <button
                className="button secondary"
                disabled={busy || email.trim() === user.email}
              >
                {busy
                  ? "Aguarde…"
                  : reauth
                    ? "Confirmar identidade e enviar"
                    : "Enviar confirmação"}
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  refreshUser()
                    .then(() => setNotice("Sessão atualizada."))
                    .catch(() =>
                      setError("Entre novamente para atualizar sua sessão."),
                    )
                }
              >
                Já confirmei, atualizar sessão
              </button>
            </form>
          </section>
          <div className="section-heading">
            <div>
              <h2>
                Meus eventos marcados{" "}
                <span className="count">{observations.length}</span>
              </h2>
              <p>O seu planejamento, sítio por sítio.</p>
            </div>
          </div>
          <ObservationList observations={observations} own />
        </>
      )}
    </Shell>
  );
}
