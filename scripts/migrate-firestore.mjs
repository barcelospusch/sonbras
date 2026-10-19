import {initializeApp,deleteApp,applicationDefault,cert} from 'firebase-admin/app';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {migrateUser,migrateTagged} from '../src/lib/migration.mjs';

const args=process.argv.slice(2),projectIndex=args.indexOf('--project'),projectId=projectIndex>=0 ? args[projectIndex+1] : null;
if(!projectId || projectId.startsWith('--'))throw new Error('Informe explicitamente --project ID. A execução padrão é somente uma simulação.');
const apply=args.includes('--apply'),cleanup=args.includes('--cleanup-legacy');
if(cleanup && !apply)throw new Error('--cleanup-legacy requer --apply. Revise a simulação primeiro.');
const email=process.env.FIREBASE_CLIENT_EMAIL,key=process.env.FIREBASE_PRIVATE_KEY;
if((email || key) && !(email && key))throw new Error('Configuração Admin incompleta.');
const app=initializeApp({projectId,...(process.env.FIRESTORE_EMULATOR_HOST ? {} : {credential:email && key ? cert({projectId,clientEmail:email,privateKey:key.replace(/\\n/g,'\n')}) : applicationDefault()})},'sonbras-migration');
const db=getFirestore(app),users=await db.collection('users').get(),now=Timestamp.now(),plan=[],deletions=[],usernames=new Map();
let taggedCount=0;
for(const user of users.docs) {
  const profile=migrateUser({...user.data(),createdAt:user.data().createdAt || user.createTime},now);
  if(profile.username){const previous=usernames.get(profile.username);if(previous)throw new Error(`Username duplicado: ${profile.username} (${previous} e ${user.id}). Nenhum documento foi alterado.`);usernames.set(profile.username,user.id);}
  plan.push({ref:user.ref,data:profile});
  const [legacy,current]=await Promise.all([user.ref.collection('observations').get(),user.ref.collection('tagged').get()]);
  const currentIds=new Set();
  for(const tagged of current.docs){const data=migrateTagged(tagged.data(),now),id=`${data.eventId}~${data.siteId}`;if(id!==tagged.id)throw new Error(`ID de tagged não canônico em ${tagged.ref.path}. Revise antes de migrar.`);currentIds.add(id);plan.push({ref:tagged.ref,data});taggedCount++;}
  for(const old of legacy.docs){const data=migrateTagged(old.data(),now),id=`${data.eventId}~${data.siteId}`;if(!currentIds.has(id)){plan.push({ref:user.ref.collection('tagged').doc(id),data});currentIds.add(id);taggedCount++;}deletions.push(old.ref);}
}
if(cleanup){
  const oldProfiles=await db.collection('publicUsers').get();
  for(const old of oldProfiles.docs){const marks=await old.ref.collection('observations').get();deletions.push(...marks.docs.map(doc=>doc.ref),old.ref);}
  const oldNames=await db.collection('usernames').get();deletions.push(...oldNames.docs.map(doc=>doc.ref));
}
console.log(JSON.stringify({projectId,mode:apply ? 'apply' : 'dry-run',users:users.size,tagged:taggedCount,writes:plan.length,deletes:cleanup ? deletions.length : 0,legacyPreserved:!cleanup},null,2));
if(apply){
  // Validate the entire plan before the first write; batches stay below Firestore's limit.
  for(let index=0;index<plan.length;index+=400){const batch=db.batch();for(const operation of plan.slice(index,index+400))batch.set(operation.ref,operation.data);await batch.commit();}
  // Verify every destination before permitting legacy cleanup. Run with writes paused.
  for(const operation of plan){const saved=await operation.ref.get();if(!saved.exists)throw new Error(`Destino ausente: ${operation.ref.path}. Limpeza cancelada.`);}
  if(cleanup)for(let index=0;index<deletions.length;index+=400){const batch=db.batch();for(const ref of deletions.slice(index,index+400))batch.delete(ref);await batch.commit();}
  console.log('Migração concluída.');
}
await deleteApp(app);
