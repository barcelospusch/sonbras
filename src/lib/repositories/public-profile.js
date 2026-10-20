import {
  documentId,
  getDoc,
  getDocs,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  runTransaction,
  startAfter,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import {
  getDatabase,
  userRef,
  usernameRef,
  observationsRef,
  publicProfileRef,
  publicObservationsRef,
  publicObservationRef,
} from "../firebase.js";
import {
  publicProfileData,
  publicObservationData,
  publicObservationId,
  samePublicData,
} from "../public-data.mjs";
import { serializeObservation } from "../observations.mjs";
import { normalizeUsername, validUsername } from "../username.mjs";

export async function syncPublicProfile(uid, data) {
  if (!validUsername(data.username)) return;
  await runTransaction(getDatabase(), async (transaction) => {
    const latest = await transaction.get(userRef(uid));
    if (!latest.exists() || !validUsername(latest.data().username)) return;
    const profile = publicProfileData(latest.data());
    const reservationRef = usernameRef(profile.username);
    const reservation = await transaction.get(reservationRef);
    const published = await transaction.get(publicProfileRef(uid));
    if (reservation.exists() && reservation.data().uid !== uid)
      throw new Error(
        "Este nome de usuário já está reservado por outra conta.",
      );
    if (!reservation.exists()) transaction.set(reservationRef, { uid });
    if (!samePublicData(published.data(), profile))
      transaction.set(publicProfileRef(uid), profile);
  });
}

// Backfill legacy accounts and avoid rewriting projections that are already current.
export async function syncPublicObservations(uid, observations) {
  const entries = await Promise.all(
    observations.map(async (observation) => ({
      id: await publicObservationId(observation.id),
      data: publicObservationData(observation.data),
    })),
  );
  const existing = await getDocsFromServer(publicObservationsRef(uid));
  const saved = new Map(existing.docs.map((entry) => [entry.id, entry.data()]));
  const ids = new Set(entries.map((entry) => entry.id));
  const operations = [
    ...entries.filter(
      (entry) => !samePublicData(saved.get(entry.id), entry.data),
    ),
    ...existing.docs
      .filter((entry) => !ids.has(entry.id))
      .map((entry) => ({ id: entry.id, data: null })),
  ];
  for (let index = 0; index < operations.length; index += 400) {
    const batch = writeBatch(getDatabase());
    for (const operation of operations.slice(index, index + 400)) {
      const ref = publicObservationRef(uid, operation.id);
      if (operation.data) batch.set(ref, operation.data);
      else batch.delete(ref);
    }
    await batch.commit();
  }
}

function readCursor(value) {
  try {
    const cursor = JSON.parse(value);
    if (
      !cursor ||
      typeof cursor.id !== "string" ||
      !cursor.id ||
      cursor.id.includes("/") ||
      typeof cursor.date !== "string" ||
      !Number.isFinite(Date.parse(cursor.date))
    )
      throw new Error();
    return cursor;
  } catch {
    throw new Error("Página de marcações inválida.");
  }
}

export async function readPublicProfile(rawUsername, viewerUid, cursorValue) {
  const username = normalizeUsername(rawUsername);
  if (!validUsername(username)) throw new Error("Perfil não encontrado.");
  let ownerUid = "",
    own = false,
    profile = null;
  if (viewerUid) {
    const ownProfile = await getDoc(userRef(viewerUid));
    if (ownProfile.exists() && ownProfile.data().username === username) {
      ownerUid = viewerUid;
      own = true;
      profile = publicProfileData(ownProfile.data());
    }
  }
  if (!profile) {
    try {
      const reservation = await getDoc(usernameRef(username));
      if (!reservation.exists())
        throw new Error("Perfil não encontrado ou não está público.");
      ownerUid = reservation.data().uid;
      const published = await getDoc(publicProfileRef(ownerUid));
      if (
        !published.exists() ||
        published.data().isPublic !== true ||
        published.data().username !== username
      )
        throw new Error("Perfil não encontrado ou não está público.");
      profile = publicProfileData(published.data());
    } catch (error) {
      if (error.code === "permission-denied")
        throw new Error("Perfil não encontrado ou não está público.");
      throw error;
    }
  }
  const constraints = [
    orderBy("dateTime", "desc"),
    orderBy(documentId(), "desc"),
  ];
  if (cursorValue) {
    const cursor = readCursor(cursorValue);
    constraints.push(
      startAfter(Timestamp.fromDate(new Date(cursor.date)), cursor.id),
    );
  }
  const snapshot = await getDocs(
    query(
      own ? observationsRef(ownerUid) : publicObservationsRef(ownerUid),
      ...constraints,
      limit(31),
    ),
  );
  const page = snapshot.docs.slice(0, 30);
  const observations = await Promise.all(
    page.map(async (entry) => ({
      id: own ? await publicObservationId(entry.id) : entry.id,
      ...publicObservationData(serializeObservation(entry.id, entry.data())),
    })),
  );
  const last = page.at(-1);
  return {
    profile,
    observations,
    nextCursor:
      snapshot.size > 30 && last
        ? JSON.stringify({
            id: last.id,
            date: serializeObservation(last.id, last.data()).dateTime,
          })
        : null,
  };
}
