'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CalendarBlankIcon, MapPinIcon, TrashIcon } from '@phosphor-icons/react';
import { useApp } from './app-provider';
import { removeObservation } from '@/lib/repositories/observations';
import { tagLabels, utcDate, type Observation, type PublicObservation } from '@/lib/types';
export function ObservationList({observations,own=false}:{observations:(Observation|PublicObservation)[];own?:boolean}) {
  const {user}=useApp();
  const [busy,setBusy]=useState(''),[error,setError]=useState('');
  if (!observations.length) return <div className="empty-state"><h3>Nenhum evento marcado por aqui</h3><p>As marcações de observação aparecerão nesta página.</p></div>;
  return <div className="observation-list">{error && <p className="error" role="alert">{error}</p>}{observations.map(o => {
    const siteId='siteId' in o ? o.siteId : '';
    return <div className={`observation-item ${own ? 'with-actions' : ''}`} key={o.id}><Link className="observation-card" href={`/events/${encodeURIComponent(o.eventId)}${own && siteId ? `?site=${encodeURIComponent(siteId)}` : ''}`}><div><span className={`observation-tag tag-${o.status}`}>{tagLabels[o.status]}</span><h3>{o.eventSnapshot.name}</h3><p><CalendarBlankIcon size={15} weight="duotone"/>{utcDate(o.eventSnapshot.dateTime)} UTC</p></div><span><MapPinIcon size={18} weight="duotone"/>{o.siteNameSnapshot}</span></Link>{own && user && <button type="button" className="icon-button remove-mark" title="Remover marcação" aria-label={`Remover marcação de ${o.eventSnapshot.name} em ${o.siteNameSnapshot}`} disabled={!!busy} onClick={async()=>{setBusy(o.id);setError('');try{await removeObservation(user.uid,o);}catch{setError('Não foi possível remover a marcação. Tente novamente.');}finally{setBusy('');}}}><TrashIcon size={19} weight="duotone"/></button>}</div>;
  })}</div>;
}
