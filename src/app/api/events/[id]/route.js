import { NextResponse } from "next/server";
import { loadEvent } from "@/lib/event-loader.mjs";
import { predictionCache } from "@/lib/server/prediction-cache.mjs";
export const runtime = "nodejs";
export async function GET(_request, { params }) {
  const { id } = await params;
  if (!/^[\w-]{1,128}$/.test(id))
    return NextResponse.json(
      { error: "Identificador inválido." },
      { status: 400 },
    );
  try {
    const event = await predictionCache(id, "event", () =>
      loadEvent(id, _request.signal),
    );
    return NextResponse.json(event);
  } catch (error) {
    const status =
      error.status === 404
        ? 404
        : error instanceof Error && error.name === "TimeoutError"
          ? 504
          : 502;
    return NextResponse.json(
      {
        error:
          status === 404
            ? "Evento não encontrado."
            : status === 504
              ? "O LIneA demorou para responder. Tente novamente em instantes."
              : "Não foi possível carregar este evento no LIneA.",
      },
      { status },
    );
  }
}
