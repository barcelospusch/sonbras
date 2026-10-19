'use client';
import {use,useEffect,useState} from 'react';
import {UserCircleIcon} from '@phosphor-icons/react';
import {Shell} from '@/components/shell';
import {ObservationList} from '@/components/observation-list';
import {useApp} from '@/components/app-provider';
import {normalizeUsername,validUsername} from '@/lib/username.mjs';
import type {PublicObservation} from '@/lib/types';
type PublicProfile={username:string;displayName:string;institution:string;isPublic:boolean};
export default function UserPage({params}:{params:Promise<{uid:string}>}) {
  const {uid:rawUsername}=use(params),username=normalizeUsername(rawUsername);
  const {user,loading:authLoading}=useApp();
  const [profile,setProfile]=useState<PublicProfile|null>(null),[tagged,setTagged]=useState<PublicObservation[]>([]);
  const [loading,setLoading]=useState(true),[more,setMore]=useState(false),[cursor,setCursor]=useState<string|null>(null);
  const [error,setError]=useState(''),[retry,setRetry]=useState(0);
  async function fetchPage(signal?:AbortSignal,nextCursor?:string) {
    const token=user ? await user.getIdToken() : null;
    const response=await fetch(`/api/users/${encodeURIComponent(username)}${nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : ''}`,{signal,cache:'no-store',headers:token ? {Authorization:`Bearer ${token}`} : {}});
    const data=await response.json();if(!response.ok)throw new Error(data.error || 'Não foi possível carregar este perfil.');
    return data as {profile:PublicProfile;tagged:PublicObservation[];nextCursor:string|null};
  }
  useEffect(()=>{
    if(authLoading)return;
    const controller=new AbortController();setLoading(true);setError('');setProfile(null);setTagged([]);setCursor(null);
    if(!validUsername(username)){setError('Este username não é válido.');setLoading(false);return;}
    fetchPage(controller.signal).then(data=>{setProfile(data.profile);setTagged(data.tagged);setCursor(data.nextCursor);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[username,user?.uid,authLoading,retry]);
  return <Shell>{loading ? <div className="empty-state"><span className="loader"/>Carregando perfil…</div> : !profile ? <div className="empty-state"><UserCircleIcon size={43} weight="duotone"/><h1>Perfil indisponível</h1><p role="alert">{error}</p><button className="button secondary" onClick={()=>setRetry(n=>n+1)}>Tentar novamente</button></div> : <><section className="public-profile-head"><span className="profile-avatar">{profile.displayName.charAt(0).toUpperCase()}</span><div><span className="eyebrow">PERFIL DO OBSERVADOR</span><h1>{profile.displayName}</h1><span className="profile-username">@{profile.username}</span><p>{profile.institution || 'Observador independente'}</p></div></section>{!profile.isPublic && <p className="notice">Prévia privada: somente você pode ver este perfil. Ative o perfil público na sua conta para compartilhar.</p>}<div className="section-heading"><div><h2>Eventos marcados</h2><p>Interesses, planos e registros de observação · horários em UTC</p></div></div>{error && <p className="error" role="alert">{error}</p>}<ObservationList observations={tagged}/>{cursor && <div className="pagination"><button className="button secondary" disabled={more} onClick={async()=>{setMore(true);setError('');try{const data=await fetchPage(undefined,cursor);setProfile(data.profile);setTagged(previous=>[...previous,...data.tagged.filter(next=>!previous.some(old=>old.id===next.id))]);setCursor(data.nextCursor);}catch(e){setError(e instanceof Error ? e.message : 'Não foi possível carregar mais eventos.');}finally{setMore(false);}}}>{more ? 'Carregando…' : 'Carregar mais eventos'}</button></div>}<p className="field-hint">As marcações representam planos e registros informados pelo observador. Predições podem ser atualizadas pelo LIneA; uma tag não confirma a ocorrência da ocultação.</p></>}</Shell>;
}
