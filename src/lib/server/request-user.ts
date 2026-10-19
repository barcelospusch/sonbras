import 'server-only';
import { NextResponse } from 'next/server';
import { adminAuth } from './firebase-admin';
import { ServiceError } from './profile-service.mjs';
export async function requestUid(request:Request,optional=false) {
  const header=request.headers.get('authorization');
  if (!header && optional) return '';
  const match=header?.match(/^Bearer (\S+)$/);
  if (!match) throw new ServiceError(401,'Entre na sua conta para continuar.');
  const auth=adminAuth();
  try {return (await auth.verifyIdToken(match[1],true)).uid;}
  catch {throw new ServiceError(401,'Sua sessão expirou. Entre novamente.');}
}
export function serviceResponse(error:unknown) {
  if (error instanceof ServiceError) return NextResponse.json({error:error.message},{status:error.status,headers:{'Cache-Control':'private, no-store'}});
  console.error('Sonbras server operation failed',error);
  return NextResponse.json({error:'Não foi possível acessar o serviço agora. Tente novamente.'},{status:503,headers:{'Cache-Control':'private, no-store'}});
}
