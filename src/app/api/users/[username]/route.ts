import { NextRequest, NextResponse } from 'next/server';
import { adminDatabase } from '@/lib/server/firebase-admin';
import { requestUid, serviceResponse } from '@/lib/server/request-user';
import { readPublicProfile } from '@/lib/server/profile-service.mjs';
export const runtime='nodejs';
export async function GET(request:NextRequest,{params}:{params:Promise<{username:string}>}) {
  try {
    const {username}=await params,viewer=await requestUid(request,true);
    const profile=await readPublicProfile(adminDatabase(),username,viewer,request.nextUrl.searchParams.get('cursor') || '');
    return NextResponse.json(profile,{headers:{'Cache-Control':'private, no-store','Vary':'Authorization'}});
  } catch(error) {return serviceResponse(error);}
}
