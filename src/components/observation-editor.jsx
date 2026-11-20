"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  BinocularsIcon,
  BookmarkSimpleIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { useApp } from "./app-provider";
import { eventId, observationSiteKey, tagLabels } from "@/lib/observations.mjs";
import { removeObservation, saveObservation } from "@/lib/repositories/observations";

const tagIcons = {
  interested: BookmarkSimpleIcon,
  planned: BinocularsIcon,
  observed: CheckCircleIcon,
};

function markSiteKey(mark) {
  return mark.defaultSiteId
    ? observationSiteKey(mark.defaultSiteId, "default")
    : observationSiteKey(mark.siteId, mark.siteSource);
}

export function EventObservationButtons({ event, siteId, siteSource }) {
  const router = useRouter();
  const {
    user, sites, defaultSites, defaultSitesLoading,
    observations, observationsReady, loading,
  } = useApp();
  const [busy, setBusy] = useState(false);
  const [lastTarget, setLastTarget] = useState(null);

  const marks = observations.filter((mark) => mark.eventId === eventId(event));
  const targetKey = siteId
    ? observationSiteKey(siteId, siteSource)
    : (lastTarget?.uid === user?.uid && lastTarget?.key) ||
      (marks[0] && markSiteKey(marks[0])) ||
      sites[0]?.id;
  const currentMark = marks.find((mark) => markSiteKey(mark) === targetKey);
  const defaultTarget = targetKey?.startsWith("default~");
  const defaultSite = defaultTarget && defaultSites.find((site) =>
    observationSiteKey(site.id, "default") === targetKey,
  );
  const targetSite = defaultTarget
    ? defaultSite && { ...defaultSite, siteSource: "default" }
    : sites.find((site) => site.id === targetKey);
  const siteName = targetSite?.name || currentMark?.siteName;

  async function toggle(tag) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!observationsReady) {
      toast.error("As marcações ainda não estão disponíveis.");
      return;
    }

    const remove = currentMark?.tag === tag;
    if (!remove && !targetSite) {
      toast.error(siteId ? "Sítio de observação indisponível." : "Cadastre um sítio para marcar este evento.");
      return;
    }

    setLastTarget({ uid: user.uid, key: targetKey });
    setBusy(true);
    try {
      if (remove) {
        await removeObservation(user.uid, currentMark);
        toast.success("Marcação removida.");
      } else {
        await saveObservation(user.uid, event, targetSite, tag, currentMark);
        toast.success("Marcação salva.");
      }
    } catch {
      toast.error("Não foi possível atualizar a marcação.");
    } finally {
      setBusy(false);
    }
  }

  const waiting = loading || (user && defaultTarget && defaultSitesLoading);
  return (
    <div
      className="event-mark-buttons"
      role="group"
      aria-label={siteName ? `Marcação do evento em ${siteName}` : "Marcação do evento"}
      aria-busy={busy}
    >
      {Object.entries(tagLabels).map(([tag, label]) => {
        const Icon = tagIcons[tag];
        const active = currentMark?.tag === tag;
        const title = active ? `${label} (clique para desmarcar)` : label;
        return (
          <button
            key={tag}
            type="button"
            className="icon-button pill"
            aria-label={label}
            aria-pressed={active}
            title={siteName ? `${title} · ${siteName}` : title}
            disabled={busy || waiting}
            onClick={() => toggle(tag)}
          >
            <Icon size={16} weight={active ? "fill" : "duotone"} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
