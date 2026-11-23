"use client";
import { removeDefaultSite, removeSite, saveDefaultSite, saveSite } from "@/lib/repositories/sites";
import { listPersonalSiteObservationIds } from "@/lib/repositories/observations";
import {
  BroadcastIcon,
  CrosshairIcon,
  FloppyDiskIcon,
  MapPinIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "./app-provider";

function useModalDialog() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return ref;
}

export function SiteForm({ site, ownerUid, isDefault = false, onClose }) {
  const { user, profile } = useApp();
  const canSave = user && (!isDefault || profile.isAdmin === true);
  const dialogRef = useModalDialog();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [location, setLocation] = useState({
    latitude: site?.latitude?.toString() ?? "",
    longitude: site?.longitude?.toString() ?? "",
  });
  async function save(event) {
    event.preventDefault();
    if (!canSave || busy) return;
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name")).trim(),
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      radiusKm: Number(form.get("radius")),
      minObservationAltitude: Number(form.get("altitude")),
    };
    if (
      !values.name ||
      Math.abs(values.latitude) > 90 ||
      Math.abs(values.longitude) > 180 ||
      !Object.values(values)
        .filter((v) => typeof v === "number")
        .every(Number.isFinite)
    ) {
      setError("Verifique o nome e as coordenadas.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (isDefault) await saveDefaultSite(values, site?.id);
      else await saveSite(ownerUid ?? user.uid, values, site?.id);
      onClose();
    } catch {
      setError(
        "Não foi possível salvar o sítio. Verifique sua conexão e as permissões do Firestore.",
      );
    } finally {
      setBusy(false);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setError(
        "Seu navegador não oferece geolocalização. Preencha as coordenadas.",
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
        setError("");
      },
      () =>
        setError(
          "Não foi possível obter sua localização. Preencha as coordenadas.",
        ),
      { timeout: 10000 },
    );
  }
  return (
    <dialog
      ref={dialogRef}
      className={ownerUid ? "modal admin-site-modal" : "modal"}
      aria-labelledby="site-form-title"
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-title">
        <span className="tile-icon">
          <MapPinIcon size={24} weight="duotone" />
        </span>
        <button
          className="icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Fechar"
        >
          <XIcon size={22} />
        </button>
      </div>
      <h2 id="site-form-title">
        {isDefault
          ? (site ? "Editar sítio padrão" : "Novo sítio padrão")
          : ownerUid && site ? "Configurações do sítio" : site ? "Editar sítio" : "Um novo ponto de observação"}
      </h2>
      <p className="muted">
        {isDefault ? "As coordenadas deste local de referência ficam visíveis para todos." : ownerUid && site ? site.name : "Defina de onde você vai observar o céu."}
      </p>
      <form onSubmit={save}>
        {ownerUid && <h3 className="admin-modal-section"><MapPinIcon size={19} weight="duotone" aria-hidden="true" /> Localização</h3>}
        <label>
          Nome do sítio
          <input
            name="name"
            required
            maxLength={100}
            placeholder="Ex.: Observatório da Serra"
            defaultValue={site?.name}
          />
        </label>
        <div className="form-grid">
          <label>
            Latitude (°)
            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              value={location.latitude}
              onChange={(e) =>
                setLocation((v) => ({ ...v, latitude: e.target.value }))
              }
              placeholder="−25,4284"
            />
          </label>
          <label>
            Longitude (°)
            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              required
              value={location.longitude}
              onChange={(e) =>
                setLocation((v) => ({ ...v, longitude: e.target.value }))
              }
              placeholder="−49,2733"
            />
          </label>
        </div>
        <button
          className="text-link location-button"
          type="button"
          onClick={locate}
        >
          <CrosshairIcon size={17} /> Usar minha localização
        </button>
        {ownerUid && <h3 className="admin-modal-section"><BroadcastIcon size={19} weight="duotone" aria-hidden="true" /> Filtros de observação</h3>}
        <div className="form-grid">
          <label>
            Raio de busca (km)
            <input
              name="radius"
              type="number"
              step="any"
              required
              min="0.1"
              max="5000"
              defaultValue={site?.radiusKm ?? 200}
            />
          </label>
          <label>
            Altitude mínima (°)
            <input
              name="altitude"
              type="number"
              step="any"
              required
              min="0"
              max="90"
              defaultValue={site?.minObservationAltitude ?? 20}
            />
          </label>
        </div>
        <p className="field-hint">
          Altitude é o ângulo da estrela acima do horizonte, não a elevação do
          terreno.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button className="button" disabled={busy || !canSave}>
            <FloppyDiskIcon size={18} weight="duotone" />
            {busy ? "Salvando…" : "Salvar sítio"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function DeleteSite({ site, ownerUid, isDefault = false, onClose }) {
  const { user, profile } = useApp();
  const dialogRef = useModalDialog();
  const uid = ownerUid ?? user?.uid;
  const canDelete = user && (!isDefault || profile.isAdmin === true);
  const canManageMarks = Boolean(!isDefault && user && uid === user.uid);
  const [check, setCheck] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canManageMarks) return;
    let active = true;
    listPersonalSiteObservationIds(uid, site.id).then(
      (ids) => {
        if (active) setCheck({ count: ids.length });
      },
      () => {
        if (active) setCheck({ failed: true });
      },
    );
    return () => { active = false; };
  }, [attempt, canManageMarks, site.id, uid]);

  const count = check?.count ?? 0;
  const ready = !canManageMarks || (check && !check.failed);

  async function confirm(withObservations) {
    if (!canDelete || busy || !ready) return;
    setBusy(true);
    setError("");
    try {
      if (isDefault) await removeDefaultSite(site.id);
      else await removeSite(uid, site.id, { withObservations });
      onClose();
    } catch {
      setError(withObservations
        ? "A exclusão não foi concluída. Você pode tentar novamente para remover as marcações restantes."
        : "Não foi possível excluir o sítio. Tente novamente.");
      setBusy(false);
    }
  }

  return (
    <dialog
      className="modal delete-site-dialog"
      ref={dialogRef}
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <span className="delete-site-icon"><TrashIcon size={24} weight="duotone" aria-hidden="true" /></span>
      <h2 id="delete-title">{isDefault ? "Excluir sítio padrão" : "Excluir"} {site.name}?</h2>
      <p id="delete-description">
        A exclusão do sítio é permanente.
        {isDefault
          ? " Ele sairá da lista pública. As marcações dos observadores serão mantidas."
          : !canManageMarks && " As marcações do titular serão mantidas."}
      </p>
      {canManageMarks && !check && <p role="status">Verificando eventos marcados…</p>}
      {check?.failed && (
        <p className="error" role="alert">Não foi possível verificar os eventos marcados.</p>
      )}
      {count > 0 && (
        <div className="delete-site-summary">
          <p><strong>{count === 1 ? "1 evento marcado" : `${count} eventos marcados`}</strong> neste sítio.</p>
          <p>Quer excluir as marcações junto com o sítio?</p>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button
          className="button secondary"
          type="button"
          onClick={onClose}
          disabled={busy}
        >
          Cancelar
        </button>
        {check?.failed && (
          <button type="button" className="button secondary" onClick={() => {
            setCheck(null);
            setAttempt((value) => value + 1);
          }}>Verificar novamente</button>
        )}
        {ready && (
          <button type="button" className={count ? "button secondary" : "button danger"}
            disabled={busy || !canDelete} onClick={() => confirm(false)}>
            {count ? "Excluir só o sítio" : "Excluir sítio"}
          </button>
        )}
        {count > 0 && (
          <button type="button" className="button danger" disabled={busy || !canDelete} onClick={() => confirm(true)}>
            Excluir sítio e marcações
          </button>
        )}
      </div>
      {busy && <p role="status">Excluindo…</p>}
    </dialog>
  );
}
