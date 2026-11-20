import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import atlas from "world-atlas/land-110m.json" with { type: "json" };
import { predictionMapPath } from "./prediction-map-path.mjs";

const land = feature(atlas, atlas.objects.land);
const grid = geoGraticule10();

export function predictionMapThumbnail(coeff) {
  const track = predictionMapPath(coeff);
  if (!track) return null;
  const [longitude, latitude] = track.center;
  const projection = geoOrthographic()
    .rotate([-longitude, -latitude])
    .translate([48, 48])
    .scale(44);
  const path = geoPath(projection).digits(0);
  const shadow = path({ type: "MultiLineString", coordinates: track.segments });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="44" fill="#e5eef6" stroke="#93a9bd"/>
  <path d="${path(land)}" fill="#afc4b6"/>
  <path d="${path(grid)}" fill="none" stroke="#6f889e" stroke-opacity=".3" stroke-width=".45"/>
  <path d="${shadow}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  <path d="${shadow}" fill="none" stroke="#084c8d" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
}
