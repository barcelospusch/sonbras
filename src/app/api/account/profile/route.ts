import { NextResponse } from 'next/server';
import { adminDatabase } from '@/lib/server/firebase-admin';
import { requestUid, serviceResponse } from '@/lib/server/request-user';
import { saveUserProfile, ServiceError } from '@/lib/server/profile-service.mjs';
export const runtime='nodejs';
export async function PUT(request:Request) {
  try {
    const uid=await requestUid(request);
    let body;
    try {body=await request.json();} catch {throw new ServiceError(400,'Dados de perfil inválidos.');}
    const profile=await saveUserProfile(adminDatabase(),uid,body);
    return NextResponse.json({profile},{headers:{'Cache-Control':'private, no-store'}});
  } catch(error) {return serviceResponse(error);}
}
