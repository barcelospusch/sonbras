import { runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import {
  getDatabase,
  userRef,
  usernameRef,
  publicProfileRef,
} from "../firebase.js";
import { normalizeUsername, validUsername } from "../username.mjs";
import { publicProfileData } from "../public-data.mjs";

export const defaultProfile = {
  displayName: "",
  email: "",
  institution: "",
  username: "",
  theme: "dark",
  isPublic: false,
  isAdmin: false,
};

export function profileInput(values, administrative = false) {
  const input = {
    displayName: String(values.displayName ?? "").trim(),
    institution: String(values.institution ?? "").trim(),
    username: normalizeUsername(String(values.username ?? "")),
    isPublic: values.isPublic === true,
  };
  if (!validUsername(input.username) && (!administrative || input.username || input.isPublic))
    throw new Error(
      "Use um nome de usuário com 3 a 30 caracteres: letras minúsculas, números, hífen ou sublinhado. Comece e termine com letra ou número.",
    );
  if ((!administrative && !input.displayName) || input.displayName.length > 100)
    throw new Error("Informe seu nome com até 100 caracteres.");
  if (input.institution.length > 150)
    throw new Error("Informe a instituição com até 150 caracteres.");
  return input;
}

export async function ensureProfile(user) {
  const ref = userRef(user.uid);
  await runTransaction(getDatabase(), async (transaction) => {
    if (!(await transaction.get(ref)).exists()) {
      transaction.set(ref, {
        ...defaultProfile,
        displayName: user.displayName || "",
        email: user.email || "",
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function syncProfileEmail(user) {
  await setDoc(
    userRef(user.uid),
    { email: user.email || "", updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function saveTheme(uid, theme) {
  if (!["dark", "light", "red"].includes(theme))
    throw new Error("Tema inválido.");
  await setDoc(
    userRef(uid),
    { theme, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function saveProfile(uid, values, { administrative = false } = {}) {
  const input = profileInput(values, administrative);
  const settings = administrative
    ? { isAdmin: values.isAdmin === true, theme: values.theme }
    : {};
  await runTransaction(getDatabase(), async (transaction) => {
    const ref = userRef(uid);
    const current = await transaction.get(ref);
    if (!current.exists())
      throw new Error(
        "Aguarde o carregamento do seu perfil e tente novamente.",
      );
    const previous = current.data().username;
    if (previous && !input.username)
      throw new Error("Informe um nome de usuário para substituir o atual.");
    const reservationRef = input.username ? usernameRef(input.username) : null;
    const reservation = reservationRef ? await transaction.get(reservationRef) : null;
    if (reservation?.exists() && reservation.data().uid !== uid)
      throw new Error("Este nome de usuário já está em uso. Escolha outro.");
    const previousRef =
      previous && previous !== input.username ? usernameRef(previous) : null;
    const previousReservation = previousRef
      ? await transaction.get(previousRef)
      : null;
    if (reservationRef) transaction.set(reservationRef, { uid });
    if (previousRef && previousReservation?.data()?.uid === uid)
      transaction.delete(previousRef);
    transaction.update(ref, { ...input, ...settings, updatedAt: serverTimestamp() });
    transaction.set(publicProfileRef(uid), publicProfileData(input));
  });
  return input;
}
