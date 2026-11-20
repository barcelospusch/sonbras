"use client";
import { use, useEffect, useRef, useState } from "react";
import {
  AtIcon,
  BuildingIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { CopyProfileLink } from "@/components/copy-profile-link";
import { Shell } from "@/components/shell";
import { SkyArt } from "@/components/sky-art";
import { ObservationList } from "@/components/observation-list";
import { useApp } from "@/components/app-provider";
import { normalizeUsername, validUsername } from "@/lib/username.mjs";
import { readPublicProfile } from "@/lib/repositories/public-profile";
export default function PublicUserPage({ params }) {
  const { uid: rawUsername } = use(params),
    username = normalizeUsername(rawUsername);
  const { user, loading: authLoading } = useApp();
  const [profile, setProfile] = useState(null),
    [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true),
    [more, setMore] = useState(false),
    [cursor, setCursor] = useState(null);
  const [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const request = useRef(null);
  async function fetchPage(signal, nextCursor) {
    signal?.throwIfAborted();
    const data = await readPublicProfile(username, user?.uid, nextCursor);
    signal?.throwIfAborted();
    return data;
  }
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    request.current = controller;
    setMore(false);
    setLoading(true);
    setError("");
    setProfile(null);
    setObservations([]);
    setCursor(null);
    if (!validUsername(username)) {
      setError("Este nome de usuário não é válido.");
      setLoading(false);
      return;
    }
    fetchPage(controller.signal)
      .then((data) => {
        setProfile(data.profile);
        setObservations(data.observations);
        setCursor(data.nextCursor);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [username, user?.uid, authLoading, retry]);
  async function loadMore() {
    const signal = request.current?.signal;
    if (!cursor || more || !signal || signal.aborted) return;
    setMore(true);
    setError("");
    try {
      const data = await fetchPage(signal, cursor);
      setProfile(data.profile);
      setObservations((previous) => {
        const ids = new Set(previous.map((observation) => observation.id));
        return [
          ...previous,
          ...data.observations.filter(
            (observation) => !ids.has(observation.id),
          ),
        ];
      });
      setCursor(data.nextCursor);
    } catch (error) {
      if (!signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar mais eventos.",
        );
    } finally {
      if (!signal.aborted) setMore(false);
    }
  }
  const displayName = profile?.displayName?.trim() || profile?.username || "";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toLocaleUpperCase("pt-BR");
  return (
    <Shell>
      {loading ? (
        <div className="empty-state">
          <span className="loader" />
          Carregando perfil…
        </div>
      ) : !profile ? (
        <div className="empty-state">
          <UserCircleIcon size={43} weight="duotone" />
          <h1>Perfil indisponível</h1>
          <p role="alert">{error}</p>
          <button
            className="button secondary"
            onClick={() => setRetry((n) => n + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <section className="public-profile-head" aria-labelledby="profile-name">
            <div className="public-profile-cover">
              <SkyArt compact />
            </div>
            <div className="public-profile-body">
              <div className="public-profile-avatar" aria-hidden="true">
                {initials}
              </div>
              <div className="public-profile-overview">
                <div>
                  <h1 id="profile-name">{displayName}</h1>
                  <ul className="public-profile-details">
                    <li>
                      <AtIcon size={17} aria-hidden="true" />
                      {profile.username}
                    </li>
                    <li>
                      <BuildingIcon size={17} weight="duotone" aria-hidden="true" />
                      {profile.institution || "Observador independente"}
                    </li>
                    {profile.publicEmail && (
                      <li>
                        <EnvelopeIcon size={17} weight="duotone" aria-hidden="true" />
                        <a href={`mailto:${encodeURIComponent(profile.publicEmail).replace("%40", "@")}`}>
                          {profile.publicEmail}
                        </a>
                      </li>
                    )}
                    {profile.orcid && (
                      <li><a href={profile.orcid}>ORCID</a></li>
                    )}
                    {profile.lattes && (
                      <li><a href={profile.lattes}>Currículo Lattes</a></li>
                    )}
                  </ul>
                </div>
                <CopyProfileLink profile={profile} />
              </div>
            </div>
          </section>
          {!profile.isPublic && (
            <p className="notice">
              Prévia privada: somente você pode ver este perfil. Ative o perfil
              público na sua conta para compartilhar.
            </p>
          )}
          <div className="section-heading">
            <div>
              <h2>Eventos marcados</h2>
              <p>
                Interesses, planos e registros de observação · horários em UTC
              </p>
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <ObservationList observations={observations} observer={profile} />
          {cursor && (
            <div className="pagination">
              <button
                className="button secondary"
                disabled={more}
                onClick={loadMore}
              >
                {more ? "Carregando…" : "Carregar mais eventos"}
              </button>
            </div>
          )}
          <p className="field-hint">
            As marcações representam planos e registros informados pelo
            observador. Predições podem ser atualizadas pelo LIneA; uma tag não
            confirma a ocorrência da ocultação.
          </p>
        </>
      )}
    </Shell>
  );
}
