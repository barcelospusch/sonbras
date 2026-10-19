'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TagIcon } from '@phosphor-icons/react';
import { useApp } from './app-provider';
import { eventId, tagLabels, type Event, type ObservationTag } from '@/lib/types';
import { removeObservation, saveObservation } from '@/lib/repositories/observations';

export function ObservationEditor({ event, initialSiteId }: { event: Event; initialSiteId?: string | null }) {
  const { user, sites, observations, profile, loading, profileError } = useApp();
  const [selected, setSelected] = useState(initialSiteId || ''), [tag, setTag] = useState<ObservationTag>('planned');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const marks = observations.filter(o => o.eventId === eventId(event));
  const selectedSite = sites.find(s => s.id === selected) || (selected ? undefined : sites[0]);
  const currentMark=marks.find(mark => mark.siteId===selectedSite?.id);
  useEffect(() => {setTag(currentMark?.status || 'planned');},[selectedSite?.id,currentMark?.status]);
  return <section className="detail-panel observation-editor"><div className="filter-title"><TagIcon size={22} weight="duotone"/><h2>Este evento está nos seus planos?</h2></div>
    {!user ? <p><Link href="/login" className="text-link">Entre na sua conta</Link> para marcar o evento e indicar de qual sítio pretende observar.</p> : loading ? <p>Carregando seus sítios…</p> : !sites.length ? <p><Link href="/" className="text-link">Cadastre um sítio</Link> para planejar esta observação.</p> : <>
      <form className="observation-form" onSubmit={async e => { e.preventDefault(); if (!selectedSite) return; setBusy(true); setError(''); setNotice(''); try { await saveObservation(user.uid,event,selectedSite,tag,marks.find(o => o.siteId === selectedSite.id)); setNotice('Marcação salva.'); } catch { setError('Não foi possível salvar a marcação. Verifique sua conexão e as regras do Firestore.'); } finally { setBusy(false); } }}>
        <label>Sítio de observação<select value={selectedSite?.id || ''} required onChange={e => { setSelected(e.target.value); const current = marks.find(o => o.siteId === e.target.value); setTag(current?.status || 'planned'); }}><option value="" disabled>Escolha um sítio</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Minha tag<select value={tag} onChange={e => setTag(e.target.value as ObservationTag)}>{Object.entries(tagLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button" disabled={busy || !selectedSite}><TagIcon size={18} weight="duotone"/>{busy ? 'Salvando…' : 'Salvar marcação'}</button>
      </form><p className="field-hint">{profile.isPublic ? 'Seu perfil público mostra esta tag e o nome do sítio, sem coordenadas.' : 'Suas marcações estão privadas. Você pode compartilhá-las ativando o perfil público em Minha conta.'}</p>
      {marks.length > 0 && <div className="my-marks">{marks.map(mark => <div key={mark.id}><span className={`observation-tag tag-${mark.status}`}>{tagLabels[mark.status]}</span><strong>{mark.siteNameSnapshot}</strong><button className="text-link" disabled={busy} onClick={() => { setSelected(mark.siteId); setTag(mark.status); setNotice('Ajuste a tag e salve a marcação.'); }}>Editar</button><button className="text-link" disabled={busy} onClick={async () => { setBusy(true); setError(''); setNotice(''); try { await removeObservation(user.uid,mark); setNotice('Marcação removida.'); } catch { setError('Não foi possível remover a marcação.'); } finally { setBusy(false); } }}>Remover</button></div>)}</div>}
    </>}{(error || profileError) && <p className="error" role="alert">{error || profileError}</p>}{notice && <p className="notice" role="status">{notice}</p>}
  </section>;
}
