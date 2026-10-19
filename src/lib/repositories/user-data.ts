import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { serializeTagged } from '@/lib/tagged.mjs';
import type { Observation, Profile, Site, Theme } from '@/lib/types';

export const defaultProfile: Profile = {
  displayName: "",
  institution: "",
  username: "",
  preferences: {theme: "dark"},
  isPublic: false,
};
type UserDataCallbacks = {
  setSites: (value: Site[]) => void;
  setObservations: (value: Observation[]) => void;
  setProfile: (value: Profile) => void;
  applyTheme: (value: Theme) => void;
  setSitesLoading: (value: boolean) => void;
  setProfileLoading: (value: boolean) => void;
  setError: (value: string) => void;
  setProfileError: (value: string) => void;
};

export function subscribeUserData(user: {uid: string; displayName: string | null}, callbacks: UserDataCallbacks) {
  if (!db) return;
  let active = true;
  const setSites = (value: Site[]) => { if (active) callbacks.setSites(value); };
  const setObservations = (value: Observation[]) => { if (active) callbacks.setObservations(value); };
  const setProfile = (value: Profile) => { if (active) callbacks.setProfile(value); };
  const applyTheme = (value: Theme) => { if (active) callbacks.applyTheme(value); };
  const setSitesLoading = (value: boolean) => { if (active) callbacks.setSitesLoading(value); };
  const setProfileLoading = (value: boolean) => { if (active) callbacks.setProfileLoading(value); };
  const setError = (value: string) => { if (active) callbacks.setError(value); };
  const setProfileError = (value: string) => { if (active) callbacks.setProfileError(value); };
  const profileRef = doc(db, "users", user.uid);
  const unsubs = [
    onSnapshot(
      query(
        collection(db, "users", user.uid, "sites"),
        orderBy("createdAt", "desc"),
      ),
      (snapshot) => {
        setSites(
          snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Site),
        );
        setSitesLoading(false);
      },
      () => {
        setSitesLoading(false);
        setError(
          "Não foi possível ler seus sítios. Verifique a conexão e as regras do Firestore.",
        );
      },
    ),
    onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const nextTheme: Theme = ["light", "red"].includes(data.preferences?.theme)
            ? data.preferences.theme
            : "dark";
          setProfile({
            ...defaultProfile,
            displayName: user.displayName || "",
            ...data,
            preferences: {theme: nextTheme},
          } as Profile);
          applyTheme(nextTheme);
          setProfileLoading(false);
        } else {
          const initial = {
            ...defaultProfile,
            displayName: user.displayName || "",
          };
          runTransaction(db!, async transaction => {
            const current = await transaction.get(profileRef);
            if (!current.exists()) transaction.set(profileRef, {
              ...initial,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }).catch(() => {
            setProfileError(
              "Não foi possível criar seu perfil. Verifique as regras do Firestore.",
            );
            setProfileLoading(false);
          });
        }
      },
      () => {
        setProfileError(
          "Não foi possível carregar seu perfil. Verifique as regras do Firestore.",
        );
        setProfileLoading(false);
      },
    ),
    onSnapshot(
      query(
        collection(db, "users", user.uid, "tagged"),
        orderBy("eventSnapshot.dateTime", "asc"),
      ),
      (snapshot) => {
        setObservations(
          snapshot.docs.map(
            (doc) => ({
              ...serializeTagged(doc.id, doc.data()),
              createdAt: doc.data().createdAt,
              updatedAt: doc.data().updatedAt,
            }) as Observation,
          ),
        );
      },
      () =>
        setProfileError(
          "Não foi possível carregar suas marcações. Verifique a conexão e as regras do Firestore.",
        ),
    ),
  ];
  return () => {
    active = false;
    unsubs.forEach(unsub => unsub());
  };
}

export async function saveTheme(uid: string, theme: Theme) {
  if (!db) throw new Error("Firebase não configurado.");
  await setDoc(doc(db, "users", uid), {preferences: {theme}, updatedAt: serverTimestamp()}, {merge: true});
}
