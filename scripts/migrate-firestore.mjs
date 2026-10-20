import {
  initializeApp,
  deleteApp,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { createHash } from "node:crypto";
import {
  publicProfileData,
  publicObservationData,
} from "../src/lib/public-data.mjs";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { migrateUser, migrateObservation } from "./lib/migration.mjs";

const args = process.argv.slice(2),
  projectIndex = args.indexOf("--project"),
  projectId = projectIndex >= 0 ? args[projectIndex + 1] : null;
if (!projectId || projectId.startsWith("--"))
  throw new Error(
    "Informe explicitamente --project ID. A execução padrão é somente uma simulação.",
  );
const apply = args.includes("--apply"),
  cleanup = args.includes("--cleanup-legacy");
if (cleanup && !apply)
  throw new Error(
    "--cleanup-legacy requer --apply. Revise a simulação primeiro.",
  );
const email = process.env.FIREBASE_CLIENT_EMAIL,
  key = process.env.FIREBASE_PRIVATE_KEY;
if ((email || key) && !(email && key))
  throw new Error("Configuração Admin incompleta.");
const app = initializeApp(
  {
    projectId,
    ...(process.env.FIRESTORE_EMULATOR_HOST
      ? {}
      : {
          credential:
            email && key
              ? cert({
                  projectId,
                  clientEmail: email,
                  privateKey: key.replace(/\\n/g, "\n"),
                })
              : applicationDefault(),
        }),
  },
  "sonbras-migration",
);
const db = getFirestore(app),
  users = await db.collection("users").get(),
  now = Timestamp.now(),
  plan = [],
  deletions = [],
  usernames = new Map();
let observationCount = 0;
for (const user of users.docs) {
  const profile = migrateUser(
    { ...user.data(), createdAt: user.data().createdAt || user.createTime },
    now,
  );
  if (profile.username) {
    const previous = usernames.get(profile.username);
    if (previous)
      throw new Error(
        `Nome de usuário duplicado: ${profile.username} (${previous} e ${user.id}). Nenhum documento foi alterado.`,
      );
    usernames.set(profile.username, user.id);
  }
  plan.push({ ref: user.ref, data: profile });
  if (profile.username)
    plan.push({
      ref: db.collection("publicUsers").doc(user.id),
      data: publicProfileData(profile),
    });
  if (profile.username)
    plan.push({
      ref: db.collection("usernames").doc(profile.username),
      data: { uid: user.id },
    });
  const sites = await user.ref.collection("sites").get();
  for (const site of sites.docs) {
    const { createdAt, ...data } = site.data();
    plan.push({
      ref: site.ref,
      data: { ...data, updatedAt: data.updatedAt || now },
    });
  }
  const [legacy, current] = await Promise.all([
    user.ref.collection("tagged").get(),
    user.ref.collection("observations").get(),
  ]);
  const currentIds = new Set();
  for (const observation of current.docs) {
    const data = migrateObservation(observation.data(), now),
      id = `${data.eventId}~${data.siteId}`;
    currentIds.add(id);
    plan.push({ ref: observation.ref, data });
    observationCount++;
  }
  for (const old of legacy.docs) {
    const data = migrateObservation(old.data(), now),
      id = `${data.eventId}~${data.siteId}`;
    if (!currentIds.has(id)) {
      plan.push({ ref: user.ref.collection("observations").doc(id), data });
      currentIds.add(id);
      observationCount++;
    }
    deletions.push(old.ref);
  }
}
for (const operation of [...plan]) {
  const parts = operation.ref.path.split("/");
  if (
    parts.length === 4 &&
    parts[0] === "users" &&
    parts[2] === "observations"
  ) {
    const publicId = createHash("sha256").update(parts[3]).digest("hex");
    plan.push({
      ref: db
        .collection("publicUsers")
        .doc(parts[1])
        .collection("observations")
        .doc(publicId),
      data: publicObservationData(operation.data),
    });
  }
}
console.log(
  JSON.stringify(
    {
      projectId,
      mode: apply ? "apply" : "dry-run",
      users: users.size,
      observations: observationCount,
      writes: plan.length,
      deletes: cleanup ? deletions.length : 0,
      legacyPreserved: !cleanup,
    },
    null,
    2,
  ),
);
if (apply) {
  // Validate the entire plan before the first write; batches stay below Firestore's limit.
  for (let index = 0; index < plan.length; index += 400) {
    const batch = db.batch();
    for (const operation of plan.slice(index, index + 400))
      batch.set(operation.ref, operation.data);
    await batch.commit();
  }
  // Verify every destination before permitting legacy cleanup. Run with writes paused.
  for (const operation of plan) {
    const saved = await operation.ref.get();
    if (!saved.exists)
      throw new Error(
        `Destino ausente: ${operation.ref.path}. Limpeza cancelada.`,
      );
  }
  if (cleanup)
    for (let index = 0; index < deletions.length; index += 400) {
      const batch = db.batch();
      for (const ref of deletions.slice(index, index + 400)) batch.delete(ref);
      await batch.commit();
    }
  console.log("Migração concluída.");
}
await deleteApp(app);
