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
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useApp } from "@/components/app-provider";
import { CopyProfileLink } from "@/components/copy-profile-link";
import { ObservationList } from "@/components/observation-list";
import { Shell } from "@/components/shell";
import { ThemePicker } from "@/components/theme-picker";
import { auth } from "@/lib/firebase";
import { saveProfile as persistProfile } from "@/lib/repositories/profile";
import {
  CalendarCheckIcon,
  EnvelopeSimpleIcon,
  FloppyDiskIcon,
  GlobeHemisphereWestIcon,
  PaletteIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";

function AccountSectionHeading({ icon: Icon, id, children }) {
  return (
    <div className="account-section-heading">
      <span className="account-section-icon"><Icon size={22} weight="duotone" aria-hidden="true" /></span>
      <h2 id={id}>{children}</h2>
    </div>
  );
}

export default function AccountPage() {
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
    orcid: "",
    lattes: "",
    publicEmail: "",
    username: "",
    isPublic: false,
  });
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [reauth, setReauth] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false),
    [emailError, setEmailError] = useState(""),
    [emailNotice, setEmailNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setValues({
      displayName: profile.displayName || user?.displayName || "",
      institution: profile.institution,
      orcid: profile.orcid ?? "",
      lattes: profile.lattes ?? "",
      publicEmail: profile.publicEmail ?? "",
      username: profile.username,
      isPublic: profile.isPublic,
    });
  }, [
    profile.displayName,
    profile.institution,
    profile.orcid,
    profile.lattes,
    profile.publicEmail,
    profile.username,
    profile.isPublic,
    user?.displayName,
  ]);
  useEffect(() => {
    setEmail("");
  }, [user?.email]);
  async function saveProfile(e) {
    e.preventDefault();
    if (!user || !auth?.currentUser) return;
    setBusy(true);
    setError("");
    try {
      const data = await persistProfile(user.uid, values);
      try {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName,
        });
        await refreshUser();
        toast.success("Perfil salvo.", { id: "save-profile" });
      } catch {
        toast.success(
          "Perfil salvo no Sonbras. O nome de exibição no login será sincronizado quando você entrar novamente.",
          { id: "save-profile" },
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      const code = e.code;
      setError(
        code === "permission-denied"
          ? "Não foi possível salvar: as regras do Firestore precisam permitir a atualização do perfil e a reserva do nome de usuário."
          : message || "Não foi possível salvar o perfil. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function changeEmail(e) {
    e.preventDefault();
    const current = auth?.currentUser;
    if (!current) return;
    setEmailBusy(true);
    setEmailError("");
    setEmailNotice("");
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
      setEmailNotice(
        "Enviamos uma confirmação para o novo e-mail. Abra o link recebido para concluir a alteração e depois atualize sua sessão.",
      );
    } catch (e) {
      const code = e.code;
      if (code === "auth/requires-recent-login") {
        setReauth(true);
        setEmailError("Confirme sua identidade abaixo para alterar o e-mail.");
      } else if (code === "auth/email-already-in-use")
        setEmailError("Este e-mail já está sendo usado por outra conta.");
      else if (code === "auth/invalid-credential")
        setEmailError(
          "Não foi possível confirmar sua identidade. Verifique sua senha.",
        );
      else
        setEmailError(
          "Não foi possível enviar a confirmação. Verifique o e-mail e tente novamente.",
        );
    } finally {
      setEmailBusy(false);
    }
  }
  async function refreshEmailSession() {
    setEmailBusy(true);
    setEmailError("");
    setEmailNotice("");
    try {
      await refreshUser();
      setEmailNotice("Sessão atualizada.");
    } catch {
      setEmailError("Entre novamente para atualizar sua sessão.");
    } finally {
      setEmailBusy(false);
    }
  }

  const displayName = profile.displayName || user?.displayName || "Observador";

  return (
    <Shell>
      <div className="account-page">
        <header className="account-header">
          <div>
            <h1>Minha conta</h1>
            <p>Gerencie seu perfil, suas preferências e seus eventos marcados.</p>
          </div>
          {user && !loading && !profileLoading && (
            <div className="account-identity">
              <UserCircleIcon size={36} weight="duotone" aria-hidden="true" />
              <div>
                <strong>{displayName}</strong>
                {profile.username && <span>@{profile.username}</span>}
              </div>
            </div>
          )}
        </header>
        {loading || profileLoading ? (
          <div className="empty-state" role="status">
            <span className="loader" aria-hidden="true" />
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
            <div className="account-settings">
              <section className="account-card" aria-labelledby="account-profile-title">
                <AccountSectionHeading icon={UserCircleIcon} id="account-profile-title">Perfil do observador</AccountSectionHeading>
                <form className="account-profile-form" onSubmit={saveProfile}>
                  <fieldset className="account-fieldset">
                    <legend>Identificação</legend>
                    <div className="account-profile-fields">
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
                        Nome de usuário
                        <input
                          required
                          minLength={3}
                          maxLength={30}
                          autoComplete="username"
                          autoCapitalize="none"
                          spellCheck={false}
                          pattern={"[a-zA-Z0-9][a-zA-Z0-9_\\-]{1,28}[a-zA-Z0-9]"}
                          placeholder="seu_nome"
                          aria-describedby="account-username-hint"
                          value={values.username}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              username: e.target.value.toLowerCase(),
                            }))
                          }
                        />
                      </label>
                      <p id="account-username-hint" className="account-field-wide field-hint">
                        Seu link: /users/{values.username || "seu_nome"}. Alterar o
                        nome de usuário libera o anterior e muda seu link.
                      </p>
                      <label className="account-field-wide">
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
                      <label>
                        ORCID (opcional)
                        <input
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder="ID ou link do ORCID"
                          value={values.orcid}
                          onChange={(e) => setValues((v) => ({ ...v, orcid: e.target.value }))}
                        />
                      </label>
                      <label>
                        Currículo Lattes (opcional)
                        <input
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder="ID ou link direto do currículo"
                          value={values.lattes}
                          onChange={(e) => setValues((v) => ({ ...v, lattes: e.target.value }))}
                        />
                      </label>
                    </div>
                  </fieldset>
                  <fieldset className="account-fieldset account-visibility">
                    <legend>Visibilidade do perfil</legend>
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
                      Ao ativar, seu nome, instituição, ORCID, Lattes, tags e nomes
                      dos sítios marcados ficam visíveis no link compartilhado.
                    </p>
                    {values.isPublic && (
                      <label>
                        E-mail público de contato (opcional)
                        <input
                          type="email"
                          maxLength={320}
                          autoComplete="email"
                          value={values.publicEmail}
                          onChange={(e) => setValues((v) => ({ ...v, publicEmail: e.target.value }))}
                        />
                        <span className="muted">Qualquer visitante do perfil poderá ver esse endereço.</span>
                      </label>
                    )}
                  </fieldset>
                  <button className="button account-save" disabled={busy || !!profileError}>
                    <FloppyDiskIcon weight="duotone" size={18} aria-hidden="true" />
                    {busy ? "Salvando…" : "Salvar perfil"}
                  </button>
                </form>
              </section>
              <div className="account-sidebar">
                <section className="account-card" aria-labelledby="account-sharing-title">
                  <AccountSectionHeading icon={GlobeHemisphereWestIcon} id="account-sharing-title">Compartilhamento</AccountSectionHeading>
                  <p className="account-visibility-label">{profile.isPublic ? "Perfil público" : "Perfil privado"}</p>
                  <p className="field-hint">
                    {profile.isPublic
                      ? "Compartilhe seu perfil e suas marcações com outros observadores."
                      : "Ative e salve seu perfil público para compartilhar suas marcações."}
                  </p>
                  <CopyProfileLink profile={profile}>
                    {profile.username && (
                      <Link
                        className="button secondary"
                        href={`/users/${profile.username}`}
                      >
                        Ver meu perfil
                      </Link>
                    )}
                  </CopyProfileLink>
                </section>
                <section className="account-card" aria-labelledby="account-appearance-title">
                  <AccountSectionHeading icon={PaletteIcon} id="account-appearance-title">Aparência</AccountSectionHeading>
                  <p className="field-hint">Seu tema acompanha sua conta em outros dispositivos.</p>
                  <ThemePicker />
                </section>
                <section className="account-card email-panel" aria-labelledby="account-email-title">
                  <AccountSectionHeading icon={EnvelopeSimpleIcon} id="account-email-title">E-mail da conta</AccountSectionHeading>
                  <p className="email-current">
                    <span className="muted">Endereço atual</span>
                    <strong>{user.email || "Nenhum endereço cadastrado"}</strong>
                  </p>
                  <p className="field-hint">
                    Abra o link enviado ao novo endereço para confirmar a alteração.
                  </p>
                  {emailError && <p className="error" role="alert">{emailError}</p>}
                  {emailNotice && <p className="notice" role="status">{emailNotice}</p>}
                  <form onSubmit={changeEmail}>
                    <div className="email-fields">
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
                      {reauth && user.providerData.some((p) => p.providerId === "password") && (
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
                    </div>
                    <div className="email-actions">
                      <button className="button secondary" disabled={emailBusy || !email.trim() || email.trim() === user.email}>
                        {emailBusy
                          ? "Aguarde…"
                          : reauth
                            ? "Confirmar identidade e enviar"
                            : "Enviar confirmação"}
                      </button>
                      <button type="button" className="text-link" disabled={emailBusy} onClick={refreshEmailSession}>
                        Já confirmei, atualizar sessão
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </div>
            <section className="account-card" aria-labelledby="account-observations-title">
              <AccountSectionHeading icon={CalendarCheckIcon} id="account-observations-title">
                Meus eventos marcados <span className="count">{observations.length}</span>
              </AccountSectionHeading>
              <ObservationList observations={observations} own />
            </section>
          </>
        )}
      </div>
    </Shell>
  );
}
