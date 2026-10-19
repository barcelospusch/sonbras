import 'server-only';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceError } from './profile-service.mjs';

export function adminConfigured() {
  return Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_USE_ADC==='true' || process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.GAE_SERVICE);
}
function adminApp() {
  if (!adminConfigured()) throw new ServiceError(503,'O serviço de perfis precisa da configuração Firebase Admin no servidor.');
  const previous=getApps().find(app=>app.name==='sonbras-server');
  if (previous) return previous;
  const projectId=process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new ServiceError(503,'Configure o projeto Firebase do servidor.');
  const email=process.env.FIREBASE_CLIENT_EMAIL,key=process.env.FIREBASE_PRIVATE_KEY;
  if ((email || key) && !(email && key)) throw new ServiceError(503,'A configuração Firebase Admin está incompleta.');
  return initializeApp({projectId,...(process.env.FIRESTORE_EMULATOR_HOST && !key ? {} : {credential:key && email ? cert({projectId,clientEmail:email,privateKey:key.replace(/\\n/g,'\n')}) : applicationDefault()})},'sonbras-server');
}
export const adminDatabase=()=>getFirestore(adminApp());
export const adminAuth=()=>getAuth(adminApp());
