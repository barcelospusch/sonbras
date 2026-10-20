import { NextResponse } from "next/server";
import {
  parsePredictionQuery,
  PredictionQueryError,
} from "@/lib/prediction-query.mjs";
import { searchPredictions } from "@/lib/server/prediction-service";
export const runtime = "nodejs";
export async function GET(request) {
  try {
    const filters = parsePredictionQuery(request.nextUrl.searchParams);
    return NextResponse.json(await searchPredictions(filters, request.signal));
  } catch (error) {
    if (error instanceof PredictionQueryError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Prediction query failed:", error);
    return NextResponse.json(
      {
        error:
          "Não foi possível consultar o LIneA. Tente novamente em instantes ou reduza o período.",
      },
      { status: 502 },
    );
  }
}
