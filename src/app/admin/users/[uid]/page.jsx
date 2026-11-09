"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { AdminArea } from "@/components/admin-area";
import { useApp } from "@/components/app-provider";
import { userRef } from "@/lib/firebase";
import { defaultProfile, saveProfile } from "@/lib/repositories/profile";

export default function AdminUserPage({ params }) {
  const { uid } = use(params);
  return <AdminArea><UserSettings key={uid} uid={uid} /></AdminArea>;
}

function UserSettings({ uid }) {
  const { user } = useApp();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => onSnapshot(
    userRef(uid),
    (snapshot) => {
      if (snapshot.exists()) setProfile({ ...defaultProfile, ...snapshot.data() });
      else setError("Usuário não encontrado.");
    },
    () => setError("Não foi possível carregar o usuário."),
  ), [uid]);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      displayName: form.get("displayName"),
      username: form.get("username"),
      institution: form.get("institution"),
      theme: form.get("theme"),
      isPublic: form.has("isPublic"),
      isAdmin: form.has("isAdmin"),
    };
    if (uid === user.uid && profile.isAdmin === true && !values.isAdmin &&
        !window.confirm("Revogar seu próprio acesso à administração?")) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await saveProfile(uid, values, { administrative: true });
      setNotice("Configurações salvas.");
    } catch (e) {
      setError(e.code === "permission-denied" ? "Sem permissão para salvar as configurações." : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/admin" className="back-link">Voltar aos usuários</Link>
      <div className="section-heading">
        <div>
          <h1>Configurações do usuário</h1>
          {profile && <p>{profile.email || uid}</p>}
        </div>
        {profile && <Link className="button secondary" href={`/admin/users/${encodeURIComponent(uid)}/sites`}>Sítios cadastrados</Link>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {profile ? (
        <section className="detail-panel">
          <form onSubmit={submit}>
            <label>Nome <input name="displayName" maxLength={100} defaultValue={profile.displayName} /></label>
            <label>Nome de usuário <input name="username" maxLength={30} defaultValue={profile.username} autoCapitalize="none" /></label>
            <label>Instituição <input name="institution" maxLength={150} defaultValue={profile.institution} /></label>
            <label>
              Tema
              <select name="theme" defaultValue={profile.theme}>
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
                <option value="red">Vermelho</option>
              </select>
            </label>
            <label className="checkbox-label"><input type="checkbox" name="isPublic" defaultChecked={profile.isPublic === true} /> Perfil público</label>
            <label className="checkbox-label"><input type="checkbox" name="isAdmin" defaultChecked={profile.isAdmin === true} /> Administrador</label>
            <button className="button" disabled={busy}>{busy ? "Salvando…" : "Salvar configurações"}</button>
          </form>
        </section>
      ) : !error && <p role="status">Carregando configurações…</p>}
    </>
  );
}
