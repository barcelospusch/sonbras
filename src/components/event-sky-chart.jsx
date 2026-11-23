"use client";

import { coordinateDegrees } from "@/lib/astronomy.mjs";
import {
  MapTrifoldIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

const initialFov = 0.5;
const minFov = 0.125;
const maxFov = 2;

export function EventSkyChart({ rightAscension, declination }) {
  const ra = coordinateDegrees(rightAscension, true);
  const dec = coordinateDegrees(declination);
  const available =
    Number.isFinite(ra) && ra >= 0 && ra <= 360 &&
    Number.isFinite(dec) && Math.abs(dec) <= 90;
  const hostRef = useRef(null);
  const atlasRef = useRef(null);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = `${ra}:${dec}:${retry}`;
  const status = result?.key === requestKey ? result.status : "loading";

  useEffect(() => {
    if (!available) return;

    const host = hostRef.current;
    let active = true;
    import("aladin-lite")
      .then(async ({ default: A }) => {
        await A.init;
        if (!active) return;

        const targetRa = ra % 360;
        const atlas = A.aladin(host, {
          target: `${targetRa} ${dec}`,
          survey: "P/DSS2/color",
          fov: initialFov,
          showFov: false,
          showZoomControl: false,
          showReticle: false,
        });
        atlasRef.current = atlas;
        atlas.gotoRaDec(targetRa, dec);
        atlas.setFoVRange(minFov, maxFov);

        const target = A.catalog({
          name: "Estrela da ocultação",
          color: "#ffdf60",
          shape: "plus",
          sourceSize: 18,
        });
        atlas.addCatalog(target);
        target.addSources([A.source(targetRa, dec)]);
        setResult({ key: requestKey, status: "ready" });
      })
      .catch(() => {
        if (active) setResult({ key: requestKey, status: "error" });
      });

    return () => {
      active = false;
      atlasRef.current?.stopAnimation();
      atlasRef.current = null;
      host.replaceChildren();
    };
  }, [available, dec, ra, requestKey]);

  function changeZoom(factor) {
    const atlas = atlasRef.current;
    const [fov] = atlas.getFov();
    atlas.setFov(Math.min(maxFov, Math.max(minFov, fov * factor)));
  }

  return (
    <section className="detail-panel" aria-labelledby="event-sky-chart-title">
      <div className="filter-title">
        <MapTrifoldIcon size={22} weight="duotone" aria-hidden="true" />
        <h2 id="event-sky-chart-title">Carta do céu</h2>
        {available && (
          <div
            className="sky-chart-controls"
            role="group"
            aria-label="Zoom da carta do céu"
          >
            <button
              type="button"
              className="icon-button"
              aria-label="Diminuir zoom"
              title="Diminuir zoom"
              disabled={status !== "ready"}
              onClick={() => changeZoom(2)}
            >
              <MagnifyingGlassMinusIcon size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Aumentar zoom"
              title="Aumentar zoom"
              disabled={status !== "ready"}
              onClick={() => changeZoom(0.5)}
            >
              <MagnifyingGlassPlusIcon size={22} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {!available ? (
        <p className="field-hint">As coordenadas da estrela estão indisponíveis.</p>
      ) : (
        <>
          <div className="sky-chart-view" aria-busy={status === "loading"}>
            <div
              key={requestKey}
              ref={hostRef}
              className="sky-chart-atlas"
              role="region"
              aria-label="Campo estelar com a estrela da ocultação marcada por uma cruz amarela"
              inert={status !== "ready"}
            />
            {status === "error" ? (
              <div className="sky-chart-status">
                <p role="alert">Não foi possível carregar a carta do céu.</p>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setRetry((count) => count + 1)}
                >
                  Tentar novamente
                </button>
              </div>
            ) : status === "loading" ? (
              <p className="sky-chart-status" role="status">Carregando carta do céu…</p>
            ) : null}
          </div>
          <p className="field-hint">
            Estrela da ocultação em ascensão reta {ra.toFixed(4)}° e declinação {dec.toFixed(4)}°.
            {" "}Imagem do céu de Aladin Lite · DSS2 / CDS.
          </p>
        </>
      )}
    </section>
  );
}
