import { NextRequest, NextResponse } from 'next/server';
import { PrecisePrediction } from '@/lib/occjs-client.mjs';
import { classifyShadow } from '@/lib/shadow.mjs';
import { predictionCache } from '@/lib/server/prediction-cache';
export const runtime='nodejs';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const p=request.nextUrl.searchParams, lat=Number(p.get('latitude')), lon=Number(p.get('longitude'));
  if (!/^[\w-]{1,128}$/.test(id) || !p.has('latitude') || !p.has('longitude') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) return NextResponse.json({error:'Coordenadas ou evento inválidos.'},{status:400});
  try {
    const paths=await predictionCache(id,'paths',async()=>{
      const api=new PrecisePrediction({signal:AbortSignal.any([request.signal,AbortSignal.timeout(20000)])});
      return api.getOccultationPaths(id);
    });
    return NextResponse.json(classifyShadow(paths,lat,lon));
  } catch {
    return NextResponse.json({shadowStatus:'unknown',error:'Não foi possível obter as faixas da sombra no LIneA.'},{status:502});
  }
}
