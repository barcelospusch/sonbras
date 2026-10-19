const R = 6378.1366;
const rad = Math.PI / 180;
const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = a => { const length = Math.hypot(...a); return length > 1e-12 ? a.map(v => v/length) : null; };
const vector = (lat,lon) => [Math.cos(lat*rad)*Math.cos(lon*rad),Math.cos(lat*rad)*Math.sin(lon*rad),Math.sin(lat*rad)];
const angle = (a,b) => Math.atan2(Math.hypot(...cross(a,b)),dot(a,b));
function points(paths,prefix) {
  const lat = paths[`${prefix}_latitude`], lon = paths[`${prefix}_longitude`];
  if (!Array.isArray(lat) || !Array.isArray(lon) || lat.length !== lon.length || lat.length < 2) return null;
  if (lat.some((v,i) => !Number.isFinite(v) || Math.abs(v)>90 || !Number.isFinite(lon[i]))) return null;
  return lat.map((v,i) => vector(v,lon[i]));
}
function corridor(paths,prefix) {
  const upper = points(paths,`${prefix}_upper_limit`), lower = points(paths,`${prefix}_lower_limit`);
  return upper && lower ? [...upper,...lower.reverse()] : null;
}
/** Spherical winding with orientation removes the antipodal false-positive and date-line discontinuity. */
export function insideSphericalPolygon(latitude,longitude,polygon) {
  if (!polygon || polygon.length < 3) return false;
  const p = vector(latitude,longitude);
  const centroid = unit(polygon.reduce((a,b) => a.map((v,i) => v+b[i]),[0,0,0]));
  if (!centroid) return false;
  let winding = 0, orientation = 0;
  for (let i=0;i<polygon.length;i++) {
    const a=polygon[i], b=polygon[(i+1)%polygon.length];
    winding += Math.atan2(dot(p,cross(a,b)),dot(a,b)-dot(p,a)*dot(p,b));
    orientation += dot(centroid,cross(a,b));
  }
  return Math.abs(winding)>Math.PI && Math.sign(winding)===Math.sign(orientation);
}
function distanceToPath(latitude,longitude,path) {
  if (!path) return NaN;
  const p=vector(latitude,longitude);
  let distance=Infinity;
  for (let i=0;i<path.length;i++) {
    const a=path[i]; distance=Math.min(distance,angle(p,a));
    if (i===0) continue;
    const b=path[i-1], n=unit(cross(a,b));
    if (!n) continue;
    const projection=unit(p.map((v,j) => v-dot(p,n)*n[j]));
    if (!projection) continue;
    for (const q of [projection,projection.map(v => -v)]) {
      if (Math.abs(angle(a,q)+angle(q,b)-angle(a,b))<1e-7) distance=Math.min(distance,angle(p,q));
    }
  }
  return distance*R;
}
export function classifyShadow(paths,latitude,longitude) {
  const body=corridor(paths,'body'), sigma=corridor(paths,'uncertainty');
  const distance=distanceToPath(latitude,longitude,points(paths,'central_path'));
  const shadowDistanceKm=Number.isFinite(distance) ? distance : null;
  if (!body) return {shadowStatus:'unknown',shadowDistanceKm};
  const bodyDistance=Math.min(distanceToPath(latitude,longitude,body),Infinity);
  if (insideSphericalPolygon(latitude,longitude,body) || bodyDistance<0.001) return {shadowStatus:'shadow',shadowDistanceKm};
  if (!sigma) return {shadowStatus:'unknown',shadowDistanceKm};
  return {shadowStatus:insideSphericalPolygon(latitude,longitude,sigma) || distanceToPath(latitude,longitude,sigma)<0.001 ? 'sigma' : 'outside',shadowDistanceKm};
}
