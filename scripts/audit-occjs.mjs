import assert from 'node:assert/strict';
import {PrecisePrediction} from '../src/lib/occjs-client.mjs';
import {filterSitePredictions} from '../src/lib/prediction-filters.mjs';
import {classifyShadow} from '../src/lib/shadow.mjs';

const start=process.argv[2] || '2026-10-19T00:00:00Z';
const end=new Date(Date.parse(start)+86400000-1).toISOString();
const query={date_time_after:start,date_time_before:end,latitude:-25.43,longitude:-49.27,location_radius:200,event_duration_min:1,magnitude_drop_min:1};
const api=new PrecisePrediction({signal:AbortSignal.timeout(55000)});
const baseline=await api.getData(query,{limit:'all'});
assert.ok(baseline.length>0,'Nenhum evento para auditar neste período. Informe outra data ISO como argumento.');
for(const event of baseline){assert.ok(event.event_duration>=1);assert.ok(event.magnitude_drop>=1);assert.ok(Date.parse(event.date_time)>=Date.parse(start)&&Date.parse(event.date_time)<=Date.parse(end));}
const [duration,drop,radius,magnitude]=await Promise.all([
  api.getData({...query,event_duration_min:1.3},{limit:'all'}),
  api.getData({...query,magnitude_drop_min:4},{limit:'all'}),
  api.getData({...query,location_radius:50},{limit:'all'}),
  api.getData({...query,magnitude_max:17},{limit:'all'}),
]);
const ids=events=>events.map(e=>e.id).sort();
assert.deepEqual(ids(duration),ids(baseline.filter(e=>e.event_duration>=1.3)),'Filtro de duração no servidor divergente.');
assert.deepEqual(ids(drop),ids(baseline.filter(e=>e.magnitude_drop>=4)),'Filtro de mag drop no servidor divergente.');
assert.ok(radius.every(e=>baseline.some(b=>b.id===e.id)),'Raio menor não pode adicionar eventos.');
assert.deepEqual(ids(magnitude),ids(baseline.filter(e=>typeof e.g_star==='number' && e.g_star<=17)),'Filtro de magnitude estelar divergente.');
const site={latitude:-25.43,longitude:-49.27,altitude:20,duration:1,drop:1,start,end,night:true};
const filtered=filterSitePredictions(baseline,site);
assert.ok(filtered.events.every(e=>e.observationAltitude>=20));
const higher=filterSitePredictions(baseline,{...site,altitude:40});
assert.ok(higher.events.length<=filtered.events.length);
const event=baseline[0],detail=await api.getPrediction(event.id);
const raw=await fetch(`https://solarsystem.linea.org.br/api/occultations/${encodeURIComponent(event.id)}/`,{signal:AbortSignal.timeout(20000)}).then(r=>r.text());
const exact=raw.match(/"gaia_source_id"\s*:\s*"?(\d+)/)?.[1];
assert.equal(String(detail.gaia_source_id),exact,'Gaia ID perdeu dígitos.');
const paths=await api.getOccultationPaths(event.id),middle=Math.floor(paths.central_path_latitude.length/2);
assert.equal(classifyShadow(paths,paths.central_path_latitude[middle],paths.central_path_longitude[middle]).shadowStatus,'shadow');
console.log(JSON.stringify({period:{start,end},upstreamEvents:baseline.length,minDuration1_3:duration.length,minDrop4:drop.length,radius50:radius.length,maxStellarMagnitude17:magnitude.length,siteAltitude20:filtered.events.length,siteAltitude40:higher.events.length,gaiaId:detail.gaia_source_id,gaiaExact:true,siteClassification:classifyShadow(paths,site.latitude,site.longitude),centralPathClassification:'shadow',sdkVersion:'0.2.0'},null,2));
