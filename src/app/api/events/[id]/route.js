import { NextResponse } from "next/server";
import { loadEvent, loadEventStar } from "@/lib/event-loader.mjs";
import { predictionCache } from "@/lib/server/prediction-cache.mjs";
import { predictionMapThumbnail } from "@/lib/server/prediction-map-thumbnail.mjs";
import { generateGlobalMap } from "@occjs/occjs";
export const runtime = "nodejs";
export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^[\w-]{1,128}$/.test(id))
    return NextResponse.json(
      { error: "Identificador inválido." },
      { status: 400 },
    );
  try {
    if (request.nextUrl.searchParams.get("star") === "1") {
      const star = await predictionCache(id, "star", () =>
        loadEventStar(id, request.signal),
      );
      return NextResponse.json(star);
    }
    const event = await predictionCache(id, "event", () =>
      loadEvent(id, request.signal),
    );
    if (request.nextUrl.searchParams.get("map") === "thumbnail") {
      let thumbnail;
      try {
        thumbnail = predictionMapThumbnail(event.occ_path_coeff);
      } catch {
        return new Response(null, { status: 404 });
      }
      return thumbnail
        ? new Response(thumbnail, {
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=300",
            },
          })
        : new Response(null, { status: 404 });
    }
    if (request.nextUrl.searchParams.get("maps") !== "1") {
      return NextResponse.json(event);
    }

    let predictionMaps = null;
    if (event.occ_path_coeff) {
      try {
        predictionMaps = { global: await generateGlobalMap(event) };
      } catch {
        // The event remains available when the prediction has no drawable path.
      }
    }
    return NextResponse.json({ ...event, predictionMaps });
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
