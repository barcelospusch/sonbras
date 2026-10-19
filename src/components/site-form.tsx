"use client";
import { saveSite, removeSite } from "@/lib/repositories/sites";
import type { Site } from "@/lib/types";
import {
  CrosshairIcon,
  FloppyDiskIcon,
  MapPinIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useApp } from "./app-provider";
export function SiteForm({
  site,
  onClose,
}: {
  site?: Site;
  onClose: () => void;
}) {
  const { user } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [location, setLocation] = useState({
    latitude: site?.latitude.toString() || "",
    longitude: site?.longitude.toString() || "",
  });
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || busy) return;
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
      await saveSite(user.uid, values, site?.id);
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
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <dialog
        open
        className="modal"
        aria-labelledby="site-form-title"
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
          {site ? "Editar sítio" : "Um novo ponto de observação"}
        </h2>
        <p className="muted">Defina de onde você vai observar o céu.</p>
        <form onSubmit={save}>
          <label>
            Nome do sítio
            <input
              name="name"
              autoFocus
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
            <button className="button" disabled={busy}>
              <FloppyDiskIcon size={18} weight="duotone" />
              {busy ? "Salvando…" : "Salvar sítio"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
export function DeleteSite({
  site,
  onClose,
}: {
  site: Site;
  onClose: () => void;
}) {
  const { user } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="modal-backdrop">
      <dialog className="modal" open aria-labelledby="delete-title">
        <h2 id="delete-title">Excluir {site.name}?</h2>
        <p>
          O sítio será removido da sua conta. Esta ação não pode ser desfeita.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            className="button danger"
            disabled={busy}
            onClick={async () => {
              if (!user) return;
              setBusy(true);
              try {
                await removeSite(user.uid, site.id);
                onClose();
              } catch {
                setError("Não foi possível excluir o sítio.");
                setBusy(false);
              }
            }}
          >
            {busy ? "Excluindo…" : "Excluir sítio"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
