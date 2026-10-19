import { NextResponse } from 'next/server';
import { PrecisePrediction } from '@/lib/occjs-client.mjs';
import { predictionCache } from '@/lib/server/prediction-cache';
export const runtime='nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w-]{1,128}$/.test(id)) return NextResponse.json({ error: 'Identificador inválido.' }, { status: 400 });
  try {
    const event = await predictionCache(id,'event',()=>new PrecisePrediction().getData({}, { id, signal: AbortSignal.any([_request.signal,AbortSignal.timeout(20000)]) }));
    return NextResponse.json(event);
  } catch (error) {
    const status = (error as { status?: number }).status === 404 ? 404 : 502;
    return NextResponse.json({ error: status === 404 ? 'Evento não encontrado.' : 'Não foi possível carregar este evento no LIneA.' }, { status });
  }
}
