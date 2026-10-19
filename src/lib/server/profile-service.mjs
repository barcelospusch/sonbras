import { FieldValue, FieldPath, Timestamp } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { normalizeUsername, validUsername } from '../username.mjs';
import { serializeTagged } from '../tagged.mjs';

export class ServiceError extends Error {
  constructor(status,message) {super(message);this.status=status;}
}
export function profileInput(body) {
  if (!body || typeof body!=='object' || Array.isArray(body) || typeof body.displayName!=='string' || typeof body.institution!=='string' || typeof body.username!=='string' || typeof body.isPublic!=='boolean') throw new ServiceError(400,'Dados de perfil inválidos.');
  const data={displayName:body.displayName.trim(),institution:body.institution.trim(),username:normalizeUsername(body.username),isPublic:body.isPublic};
  if (!data.displayName || data.displayName.length>100 || data.institution.length>150) throw new ServiceError(400,'Verifique seu nome e instituição.');
  if (!validUsername(data.username)) throw new ServiceError(400,'Use um username com 3 a 30 caracteres, começando e terminando com letra ou número.');
  return data;
}
/** Username lookup and mutation share a server transaction; client writes cannot change username. */
export async function saveUserProfile(database,uid,body) {
  const input=profileInput(body),ref=database.collection('users').doc(uid);
  await database.runTransaction(async transaction => {
    const [current,matching]=await Promise.all([transaction.get(ref),transaction.get(database.collection('users').where('username','==',input.username).limit(2))]);
    if (matching.docs.some(doc=>doc.id!==uid)) throw new ServiceError(409,'Este username já está em uso. Escolha outro.');
    const previous=current.data() || {},theme=['dark','light','red'].includes(previous.preferences?.theme) ? previous.preferences.theme : 'dark';
    transaction.set(ref,{...input,preferences:{theme},createdAt:previous.createdAt || FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  });
  return input;
}
function decodeCursor(value) {
  if (!value) return null;
  try {
    const parsed=JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
    if (typeof parsed.id!=='string' || !/^[\w~-]{1,260}$/.test(parsed.id) || typeof parsed.date!=='string' || !Number.isFinite(Date.parse(parsed.date))) throw new Error();
    return parsed;
  } catch {throw new ServiceError(400,'Página de marcações inválida.');}
}
export async function readPublicProfile(database,rawUsername,viewerUid='',cursorValue='') {
  const username=normalizeUsername(rawUsername);
  if (!validUsername(username)) throw new ServiceError(404,'Perfil não encontrado.');
  const cursor=decodeCursor(cursorValue);
  return database.runTransaction(async transaction => {
    const matches=await transaction.get(database.collection('users').where('username','==',username).limit(2));
    if (matches.size!==1) throw new ServiceError(404,'Perfil não encontrado.');
    const owner=matches.docs[0],data=owner.data();
    if (data.isPublic!==true && owner.id!==viewerUid) throw new ServiceError(404,'Este perfil não está público.');
    let taggedQuery=owner.ref.collection('tagged').orderBy('eventSnapshot.dateTime','desc').orderBy(FieldPath.documentId(),'desc').limit(31);
    if (cursor) taggedQuery=taggedQuery.startAfter(Timestamp.fromDate(new Date(cursor.date)),cursor.id);
    const snapshot=await transaction.get(taggedQuery),page=snapshot.docs.slice(0,30);
    const tagged=page.map(doc=>{
      const serialized=serializeTagged(doc.id,doc.data());
      // Explicit whitelist: no uid, siteId, coordinates, preferences or account metadata.
      return {id:createHash('sha256').update(`${owner.id}:${serialized.id}`).digest('hex'),eventId:serialized.eventId,status:serialized.status,eventSnapshot:serialized.eventSnapshot,siteNameSnapshot:serialized.siteNameSnapshot};
    });
    const last=page.at(-1);
    return {profile:{username:data.username,displayName:data.displayName,institution:data.institution,isPublic:data.isPublic===true},tagged,nextCursor:snapshot.size>30 && last ? Buffer.from(JSON.stringify({date:last.data().eventSnapshot.dateTime.toDate().toISOString(),id:last.id})).toString('base64url') : null};
  },{readOnly:true});
}
