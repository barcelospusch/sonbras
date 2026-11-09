"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { documentId, getDocsFromServer, limit, orderBy, query, startAfter } from "firebase/firestore";
import { usersRef } from "@/lib/firebase";
import { AdminArea } from "@/components/admin-area";

const pageSize = 25;

export default function AdminPage() {
  return <AdminArea><UserDirectory /></AdminArea>;
}

function UserDirectory() {
  const [cursors, setCursors] = useState([null]);
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const cursor = cursors.at(-1);

  useEffect(() => {
    const constraints = cursor ? [startAfter(cursor)] : [];
    let active = true;
    getDocsFromServer(query(usersRef(), orderBy(documentId()), ...constraints, limit(pageSize + 1)))
      .then((snapshot) => {
        if (active) setEntries(snapshot.docs);
      })
      .catch((failure) => {
        if (!active) return;
        setError(
          failure.code === "permission-denied"
            ? "O Firestore negou a listagem. Confirme que as regras atuais foram publicadas neste projeto e que sua conta tem isAdmin: true."
            : "Não foi possível listar os usuários. Verifique sua conexão e tente novamente.",
        );
      });
    return () => {
      active = false;
    };
  }, [cursor, attempt]);

  function changePage(next) {
    setEntries(null);
    setError("");
    setCursors(next);
  }

  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">ADMINISTRAÇÃO</span>
        <h1>Usuários</h1>
        <p>Gerencie os perfis, os níveis de acesso e os sítios cadastrados.</p>
      </div>
      {error ? (
        <div className="error">
          <p role="alert">{error}</p>
          <button className="button secondary" onClick={() => {
            setError("");
            setAttempt((value) => value + 1);
          }}>
            Tentar novamente
          </button>
        </div>
      ) : !entries ? (
        <p role="status">Carregando usuários…</p>
      ) : (
        <>
          {entries.length ? (
            <ul className="admin-users">
              {entries.slice(0, pageSize).map((entry) => {
                const profile = entry.data();
                const href = `/admin/users/${encodeURIComponent(entry.id)}`;
                return (
                  <li className="detail-panel" key={entry.id}>
                    <div>
                      <h2>{profile.displayName || profile.email || entry.id}</h2>
                      <p>{profile.email}</p>
                      {profile.isAdmin === true && <span className="status-badge">Administrador</span>}
                    </div>
                    <div className="share-actions">
                      <Link className="button secondary" href={href}>Configurações</Link>
                      <Link className="button secondary" href={`${href}/sites`}>Sítios</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p>Nenhum usuário nesta página.</p>}
          <div className="share-actions">
            <button className="button secondary" disabled={cursors.length === 1} onClick={() => changePage(cursors.slice(0, -1))}>Anterior</button>
            <button className="button secondary" disabled={entries.length <= pageSize} onClick={() => changePage([...cursors, entries[pageSize - 1].id])}>Próxima</button>
          </div>
        </>
      )}
    </>
  );
}
