/* Registro del Patrimonio Cultural · San Andrés de Giles
   App estática para GitHub Pages — Leaflet 1.9 */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS_KEY = 'pcsag.localizaciones.v1';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
};

const CATS = {
  '1': { n: 'Histórico-Simbólico', d: 'Bien que sustentó un hecho de importancia en la historia local, provincial o nacional, o caso único y referente comunitario.' },
  '2': { n: 'Artístico-Arquitectónico', d: 'Valor del hecho artístico o arquitectónico: pureza estilística, calidad constructiva, representatividad tipológica.' },
  '3': { n: 'Urbanístico-Ambiental', d: 'Espacios del entorno urbano o bienes integrados que conforman un sitio de relevancia estética, paisajística o ambiental.' },
  '4': { n: 'Patrimonio Inmaterial', d: 'Usos, expresiones, saberes y técnicas que la comunidad reconoce como propios (Ord. 2446/21, UNESCO 2003).' },
  '0': { n: 'Sin ordenanza', d: 'Asientos con dictamen, decreto o norma de otra jurisdicción: requieren ordenanza (art. 8º).' }
};
const LST = {
  kml: 'KML de lugares declarados', parcela: 'Parcela del parcelario 2024', planilla: 'Parcela (catastro a verificar)',
  coord: 'Coordenadas de la Comisión', aprox: 'Ubicación aproximada', tentativa: 'Ubicación tentativa',
  general: 'Alcance general', pendiente: 'Sin localizar', comision: 'Localización incorporada', propuesta: 'Propuesta local (sin publicar)'
};
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const catOf = b => b.sin ? '0' : (b.cats[0] || '1');
const colorOf = b => cssVar('--c' + catOf(b));

let DATA, BIENES = [], BY = {}, REPO_LOC = {}, LOCAL_LOC = store.get(LS_KEY, {});

/* ------------ effective geometry ------------ */
function geomOf(b) {
  if (LOCAL_LOC[b.id]) return { g: [LOCAL_LOC[b.id].geom], st: 'propuesta', src: 'Propuesta local · ' + (LOCAL_LOC[b.id].metodo || '') };
  if (REPO_LOC[b.id]) return { g: [REPO_LOC[b.id].geometry], st: 'comision', src: 'Localización incorporada por la Comisión' + (REPO_LOC[b.id].properties.metodo ? ' · ' + REPO_LOC[b.id].properties.metodo : '') };
  if (b.g) return { g: b.g, st: b.lst, src: b.lsrc };
  return { g: null, st: b.lst, src: null };
}
const located = b => !!geomOf(b).g;
function ptOf(b) {
  const G = geomOf(b).g; if (!G) return null;
  const g = G[0];
  if (g.type === 'Point') return [g.coordinates[1], g.coordinates[0]];
  if (g.type === 'MultiPoint') return [g.coordinates[0][1], g.coordinates[0][0]];
  if (b.pt && !LOCAL_LOC[b.id] && !REPO_LOC[b.id]) return [b.pt[1], b.pt[0]];
  const c = L.geoJSON(g).getBounds().getCenter(); return [c.lat, c.lng];
}

/* ------------ boot ------------ */
async function boot() {
  initTheme();
  const [reg, loc] = await Promise.all([
    fetch('data/registro.json').then(r => r.json()),
    fetch('data/localizaciones.json').then(r => r.ok ? r.json() : { features: [] }).catch(() => ({ features: [] }))
  ]);
  DATA = reg; BIENES = reg.bienes; BIENES.forEach(b => BY[b.id] = b);
  (loc.features || []).forEach(f => { if (f.properties && f.properties.id) REPO_LOC[f.properties.id] = f; });
  renderInicio(); renderFichasFilters(); renderNormativa(); renderAcerca();
  window.addEventListener('hashchange', route); route();
}

/* ------------ theme ------------ */
function initTheme() {
  const saved = store.get('pcsag.theme', null);
  if (saved) document.documentElement.dataset.theme = saved;
  $('#themeBtn').onclick = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nx; store.set('pcsag.theme', nx);
    if (MAP) refreshBienes();
  };
}

/* ------------ router ------------ */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  return { r: parts[0] || 'inicio', a: parts[1] ? decodeURIComponent(parts[1]) : null, q: new URLSearchParams(qs || '') };
}
function route() {
  const { r, a, q } = parseHash();
  const view = { inicio: 'inicio', mapa: 'mapa', localizar: 'mapa', fichas: 'fichas', ficha: 'ficha', normativa: 'normativa', acerca: 'acerca' }[r] || 'inicio';
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + view));
  $$('.tabs a').forEach(t => t.classList.toggle('on', t.dataset.r === (view === 'ficha' ? 'fichas' : view)));
  document.body.classList.toggle('map-on', view === 'mapa');
  if (view === 'mapa') { initMap(); setTimeout(() => MAP.invalidateSize(), 50); if (r === 'localizar' && a) startLocate(a); else if (a) focusBien(a); }
  if (view === 'fichas') { if (q.get('q')) $('#fSearch').value = q.get('q'); renderCards(); }
  if (view === 'ficha') renderFicha(a);
  if (view !== 'ficha' || !a) window.scrollTo(0, 0);
}

/* ------------ inicio ------------ */
function renderInicio() {
  const reg = BIENES.filter(b => !b.sin);
  const normas = new Set(reg.map(b => b.norma));
  const loc = BIENES.filter(located).length;
  const pend = BIENES.filter(b => !located(b) && b.lst !== 'general').length;
  $('#stats').innerHTML = [
    ['Asientos con ordenanza', reg.length], ['Ordenanzas declaratorias', normas.size], ['Sin ordenanza', BIENES.length - reg.length],
    ['Bienes localizados', loc], ['Por localizar', pend], ['Desde', '1988']
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#catList').innerHTML = ['1', '2', '3', '4', '0'].map(c => {
    const n = c === '0' ? BIENES.filter(b => b.sin).length : reg.filter(b => b.cats.includes(c)).length;
    return `<li><span class="sw" style="background:var(--c${c})"></span><div><b>${CATS[c].n}</b><p>${CATS[c].d}</p></div><span class="n">${n}</span></li>`;
  }).join('');
  // chart
  const by = {}; reg.forEach(b => { const y = +b.anio; by[y] = (by[y] || 0) + 1; });
  const ys = Object.keys(by).map(Number).sort((a, b) => a - b);
  const W = 560, H = 190, P = 26, bw = (W - P * 2) / ys.length, max = Math.max(...Object.values(by));
  $('#chartYears').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Asientos por año">${ys.map((y, i) => {
    const h = (by[y] / max) * (H - P * 2); const x = P + i * bw;
    return `<g><rect class="bar" x="${x + 2}" y="${H - P - h}" width="${bw - 4}" height="${h}" rx="3"><title>${y}: ${by[y]} asientos</title></rect><text x="${x + bw / 2}" y="${H - P - h - 4}" text-anchor="middle">${by[y]}</text><text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${String(y).slice(2)}</text></g>`;
  }).join('')}</svg>`;
  const lc = {}; BIENES.forEach(b => lc[b.loc] = (lc[b.loc] || 0) + 1);
  $('#locStrip').innerHTML = Object.entries(lc).sort((a, b) => b[1] - a[1]).map(([l, n]) => `<a href="#/fichas?loc=${encodeURIComponent(l)}" data-loc="${esc(l)}"><b>${n}</b>${esc(l)}</a>`).join('');
  $$('#locStrip a').forEach(a => a.onclick = e => { e.preventDefault(); $('#fLoc').value = a.dataset.loc; $('#fSin').checked = true; location.hash = '#/fichas'; });
}

/* ------------ fichas (catálogo) ------------ */
function opt(sel, arr, all) { sel.innerHTML = `<option value="">${all}</option>` + arr.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join(''); }
function renderFichasFilters() {
  opt($('#fLoc'), [...new Set(BIENES.map(b => b.loc))].sort().map(v => [v, v]), 'Todas las localidades');
  opt($('#fCat'), ['1', '2', '3', '4'].map(c => [c, CATS[c].n]), 'Todas las categorías');
  opt($('#fTipo'), [...new Set(BIENES.map(b => b.tipo).filter(Boolean))].sort().map(v => [v, v]), 'Todo tipo de bien');
  opt($('#fLst'), [['si', 'Localizados'], ['no', 'Sin localizar'], ['fotos', 'Con fotografías']], 'Localización: todos');
  ['#fSearch', '#fLoc', '#fCat', '#fTipo', '#fLst', '#fSin'].forEach(s => $(s).addEventListener('input', renderCards));
}
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function matchText(b, q) {
  if (!q) return true;
  const hay = norm([b.id, b.n, b.ubi, b.locRaw, b.norma, b.cat, b.fig, b.res, b.fund, b.obs, b.tipo].join(' '));
  return norm(q).split(/\s+/).every(t => hay.includes(t));
}
function filtered() {
  const q = $('#fSearch').value, l = $('#fLoc').value, c = $('#fCat').value, t = $('#fTipo').value, s = $('#fLst').value, sin = $('#fSin').checked;
  return BIENES.filter(b => (sin || !b.sin) && matchText(b, q) && (!l || b.loc === l) && (!c || b.cats.includes(c)) && (!t || b.tipo === t) &&
    (!s || (s === 'si' ? located(b) : s === 'no' ? !located(b) : b.fotos.length)));
}
function cardHTML(b) {
  const c = catOf(b);
  const p = located(b) ? ptOf(b) : null;
  const th = b.fotos.length ? `<img loading="lazy" src="${b.fotos[0].src}" alt="">` :
    p ? satThumb(p[0], p[1], c) :
    `<div class="pat" style="--cc:var(--c${c})"><span>${b.sin ? 'S/O' : b.id}</span><small>sin localizar</small></div>`;
  const st = geomOf(b).st;
  return `<a class="card" href="#/ficha/${b.id}"><div class="th">${th}<span class="id">${b.sin ? 'S/O ' + b.id.slice(1) : 'Nº ' + b.id}</span></div>
  <div class="bd"><h3>${esc(b.n)}</h3><div class="m">${esc(b.locRaw || b.loc)} · ${esc(b.norma)}${b.anio ? ' · ' + esc(b.anio) : ''}</div>
  <div class="cc">${b.sin ? '<span class="pill c0">Sin ordenanza</span>' : b.cats.map(k => `<span class="pill c${k}">${CATS[k].n}</span>`).join('')}${!located(b) && st !== 'general' ? '<span class="pill ghost">Sin localizar</span>' : ''}</div></div></a>`;
}
function satThumb(lat, lng, c) {
  const z = 17, n = 2 ** z;
  const xf = (lng + 180) / 360 * n, yf = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n;
  const x0 = Math.floor(xf - .5), y0 = Math.floor(yf - .5);
  const px = (xf - x0) * 256, py = (yf - y0) * 256;
  const tiles = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dy]) => `<img loading="lazy" alt="" onerror="this.style.visibility='hidden'" src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y0 + dy}/${x0 + dx}" style="left:${dx * 256}px;top:${dy * 256}px">`).join('');
  return `<div class="sat" style="left:calc(50% - ${px.toFixed(0)}px);top:calc(50% - ${py.toFixed(0)}px)">${tiles}</div><span class="dot" style="background:var(--c${c})"></span>`;
}
function renderCards() {
  const list = filtered();
  $('#fCount').textContent = `${list.length} ficha${list.length === 1 ? '' : 's'}`;
  $('#cards').innerHTML = list.map(cardHTML).join('') || '<p class="muted">Sin resultados para esos filtros.</p>';
}

/* ------------ ficha ------------ */
let MINI;
function row(k, v, mono) { return v ? `<dt>${k}</dt><dd${mono ? ' class="mono"' : ''}>${v}</dd>` : ''; }
function renderFicha(id) {
  const b = BY[id]; const el = $('#ficha');
  if (!b) { el.innerHTML = '<p>Ficha no encontrada. <a href="#/fichas">Volver al catálogo</a></p>'; return; }
  const order = BIENES.map(x => x.id); const i = order.indexOf(id);
  const prev = BY[order[(i - 1 + order.length) % order.length]], next = BY[order[(i + 1) % order.length]];
  const c = catOf(b); const G = geomOf(b);
  el.style.setProperty('--c', `var(--c${c})`);
  el.innerHTML = `
  <nav class="fnav no-print"><a class="btn small" href="#/fichas">← Catálogo</a>
    <span><a class="btn small" href="#/ficha/${prev.id}" title="${esc(prev.n)}">‹ ${prev.sin ? 'S/O ' + prev.id.slice(1) : prev.id}</a>
    <a class="btn small" href="#/ficha/${next.id}" title="${esc(next.n)}">${next.sin ? 'S/O ' + next.id.slice(1) : next.id} ›</a>
    <button class="btn small" onclick="window.print()">Imprimir ficha</button></span></nav>
  <header class="fhead"><div>
    <p class="kicker">Ficha patrimonial · ${b.sin ? 'Asiento sin ordenanza (planilla 2024 Nº ' + b.id.slice(1) + ')' : 'Registro Oficial Nº ' + b.id}</p>
    <h1>${esc(b.n)}</h1>
    <div class="cc">${b.sin ? '<span class="pill c0">Sin ordenanza</span>' : b.cats.map(k => `<span class="pill c${k}">${CATS[k].n}</span>`).join(' ')}
    <span class="pill ghost">${esc(b.estado)}</span>${b.alta ? '<span class="pill ghost">Alta 2026</span>' : ''}</div>
  </div><div class="fid">${b.sin ? 'S/O' : b.id}</div></header>
  <div class="fgrid"><div>
    ${b.fotos.length ? `<div class="gal">${b.fotos.map(f => `<figure data-src="${f.src}" data-cap="${esc(f.cap)}"><img loading="lazy" src="${f.src}" alt="${esc(f.cap)}"><figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}</div>` : ''}
    ${b.res ? `<p class="res">${esc(b.res)}</p>` : ''}
    ${b.datos.length ? `<ul class="keys">${b.datos.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
    ${b.fund ? `<h3>Fundamento del valor patrimonial (texto del registro)</h3><p>${esc(b.fund)}</p>` : ''}
    ${b.obs ? `<h3>Observaciones</h3><p>${esc(b.obs)}</p>` : ''}
    ${b.corr ? `<div class="box warn"><b>Corrección de cita.</b> ${esc(b.corr)}</div>` : ''}
    ${b.fuentes.length ? `<h3>Fuentes consultadas</h3><ol class="src">${b.fuentes.map(f => `<li>${f.u ? `<a href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.t)}</a>` : esc(f.t)}</li>`).join('')}</ol>` : ''}
  </div><aside>
    <h3>Localización</h3>
    ${G.g ? `<div class="minimap" id="mini"></div><p class="lsrc"><b>${LST[G.st] || ''}</b>${G.src ? ' — ' + esc(G.src) : ''}</p>
      <p class="no-print"><a class="btn small" href="#/mapa/${b.id}">Ver en el mapa</a> <a class="btn small" href="#/localizar/${b.id}">Corregir localización</a></p>`
      : b.lst === 'general' ? `<div class="box">Bien de alcance general: no corresponde a un punto del territorio.</div>`
      : `<div class="box warn"><b>Sin localizar.</b> El instrumento no permite ubicarlo con certeza. Podés proponer su localización desde el mapa: clic en el terreno, en una parcela del parcelario o por búsqueda de dirección.<p class="no-print" style="margin:.8em 0 0"><a class="btn small warn" href="#/localizar/${b.id}">Localizar este bien</a></p></div>`}
    <h3>Identificación</h3>
    <dl class="dl">${row('Localidad', esc(b.locRaw))}${row('Ubicación', esc(b.ubi))}${row('Catastro', esc(b.cat), 1)}${row('Fuente catastro', esc(b.catSrc))}${row('Parcela vinculada', esc(b.pc), 1)}${row('Tipo de bien', esc(b.tipo))}${row('Categoría', esc(b.catTxt))}</dl>
    <h3>Instrumento</h3>
    <dl class="dl">${row('Norma de origen', esc(b.norma))}${row('Artículo / inciso', esc(b.art))}${row('Año', esc(b.anio))}${row('Figura de origen', esc(b.fig))}${row('Estado registral', esc(b.estado))}${row('Expediente', esc(b.exp), 1)}${row('Dictamen CMAPCSAG', esc(b.dict))}${row('Régimen', esc(b.reg))}</dl>
  </aside></div>`;
  $$('.gal figure', el).forEach(f => f.onclick = () => lightbox(f.dataset.src, f.dataset.cap));
  if (MINI) { MINI.remove(); MINI = null; }
  if (G.g) {
    MINI = L.map('mini', { zoomControl: true, attributionControl: false, scrollWheelZoom: false });
    satLayer().addTo(MINI); labelsLayer().addTo(MINI);
    const lay = L.geoJSON({ type: 'FeatureCollection', features: G.g.map(g => ({ type: 'Feature', geometry: g })) }, {
      style: { color: '#fff', weight: 2, fillColor: colorOf(b), fillOpacity: .45 },
      pointToLayer: (f, ll) => L.circleMarker(ll, { radius: 9, color: '#fff', weight: 2, fillColor: colorOf(b), fillOpacity: 1 })
    }).addTo(MINI);
    const bb = lay.getBounds(); MINI.fitBounds(bb.pad(0.6), { maxZoom: 18 });
    if (bb.getNorthEast().equals(bb.getSouthWest())) MINI.setView(bb.getCenter(), 17);
  }
  document.title = b.n + ' · Patrimonio SAG';
}
function lightbox(src, cap) {
  const d = document.createElement('div'); d.className = 'lightbox';
  d.innerHTML = `<div><img src="${src}" alt=""><p>${cap}</p></div>`; d.onclick = () => d.remove();
  document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { d.remove(); document.removeEventListener('keydown', k); } });
  document.body.appendChild(d);
}

/* ------------ mapa ------------ */
let MAP, BASES, LAYERS = {}, REFS = {}, CAT_ON = { '1': 1, '2': 1, '3': 1, '4': 1, '0': 1 }, LOCATING = null, TEMP = null, PARC_INDEX = null, HILITE = null;
const satLayer = () => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 19, attribution: 'Imagen © Esri, Maxar, Earthstar Geographics' });
const labelsLayer = () => L.layerGroup([
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 19, opacity: .7 }),
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 19 })
]);
function initMap() {
  if (MAP) return;
  MAP = L.map('map', { preferCanvas: false, zoomControl: true }).setView([-34.445, -59.447], 14);
  BASES = {
    sat: L.layerGroup([satLayer(), labelsLayer()]),
    satp: satLayer(),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' })
  };
  BASES.sat.addTo(MAP);
  $$('input[name=base]').forEach(r => r.onchange = () => { Object.values(BASES).forEach(l => MAP.removeLayer(l)); BASES[r.value].addTo(MAP); });
  L.control.scale({ imperial: false }).addTo(MAP);
  MAP.createPane('mensuras').style.zIndex = 380;
  MAP.createPane('parcelas').style.zIndex = 390;
  MAP.createPane('bienes').style.zIndex = 450;
  LAYERS.bienes = L.layerGroup().addTo(MAP);
  refreshBienes();
  $$('#layers input[type=checkbox]').forEach(cb => cb.onchange = () => toggleLayer(cb.dataset.l, cb.checked));
  $('#mensOp').oninput = e => { if (LAYERS.mensuras) LAYERS.mensuras.setStyle({ fillOpacity: e.target.value / 100 * .5, opacity: Math.min(1, e.target.value / 100 + .2) }); };
  $('#sideToggle').onclick = () => $('#side').classList.toggle('open');
  $('#layers h3').onclick = () => $('#layers').classList.toggle('min');
  if (innerWidth < 900) $('#layers').classList.add('min');
  // filters
  $('#mapFilters').innerHTML = ['1', '2', '3', '4', '0'].map(c => `<button class="chip" data-c="${c}"><span class="sw" style="background:var(--c${c})"></span>${CATS[c].n}</button>`).join('');
  $$('#mapFilters .chip').forEach(ch => ch.onclick = () => { const c = ch.dataset.c; CAT_ON[c] = !CAT_ON[c]; ch.classList.toggle('off', !CAT_ON[c]); refreshBienes(); });
  $('#mapSearch').addEventListener('input', () => { renderMapList(); });
  $('#mapSearch').addEventListener('keydown', e => { if (e.key === 'Enter') searchNomenclatura($('#mapSearch').value); });
  MAP.on('click', onMapClick);
  MAP.on('zoomend', parcelVisibility);
  renderLegend(); renderLocPanel();
}
function inFilter(b) { return CAT_ON[catOf(b)] && (b.sin ? true : b.cats.some(c => CAT_ON[c])); }
function refreshBienes() {
  if (!MAP) return;
  LAYERS.bienes.clearLayers(); REFS = {};
  const polys = [], pts = [];
  BIENES.filter(b => inFilter(b) && located(b)).forEach(b => {
    const G = geomOf(b); const col = colorOf(b);
    const grp = L.featureGroup();
    G.g.forEach(g => {
      if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
        L.geoJSON(g, { pane: 'bienes', style: { color: col, weight: 2, fillColor: col, fillOpacity: .32, dashArray: G.st === 'planilla' ? '4 3' : null } }).addTo(grp);
      } else if (g.type === 'MultiPoint') {
        g.coordinates.forEach(c => L.circleMarker([c[1], c[0]], { pane: 'bienes', radius: 6, color: '#fff', weight: 1.5, fillColor: col, fillOpacity: 1 }).addTo(grp));
      }
    });
    const p = ptOf(b);
    const dashed = ['aprox', 'tentativa', 'propuesta'].includes(G.st);
    L.circleMarker(p, { pane: 'bienes', radius: 7, color: dashed ? cssVar('--accent') : '#fff', weight: dashed ? 2.5 : 2, fillColor: col, fillOpacity: 1 }).addTo(grp);
    grp.bindPopup(() => popupBien(b), { maxWidth: 300 });
    grp.addTo(LAYERS.bienes); REFS[b.id] = grp;
  });
  renderMapList();
}
function popupBien(b) {
  const G = geomOf(b);
  return `<div class="pop"><h4>${esc(b.n)}</h4><div class="meta">${b.sin ? 'Sin ordenanza' : 'Nº ' + b.id} · ${esc(b.norma)} · ${esc(b.locRaw)}</div>
  ${b.fotos[0] ? `<img src="${b.fotos[0].src}" alt="" style="border-radius:8px;margin-bottom:8px;aspect-ratio:16/9;object-fit:cover">` : ''}
  <div>${esc((b.res || b.fund || '').slice(0, 220))}${(b.res || b.fund || '').length > 220 ? '…' : ''}</div>
  <div class="meta" style="margin-top:6px">${LST[G.st] || ''}</div>
  <a class="btn small primary" href="#/ficha/${b.id}">Ver ficha</a> <a class="btn small" href="#/localizar/${b.id}">Corregir</a></div>`;
}
function renderMapList() {
  const q = $('#mapSearch').value;
  const list = BIENES.filter(b => inFilter(b) && matchText(b, q));
  $('#mapList').innerHTML = list.map(b => {
    const st = geomOf(b).st; const tag = !located(b) ? (st === 'general' ? '<span class="tag">general</span>' : '<span class="tag pend">sin ubicar</span>') :
      st === 'propuesta' ? '<span class="tag prop">propuesta</span>' : st === 'aprox' ? '<span class="tag aprox">aprox.</span>' : st === 'tentativa' ? '<span class="tag tent">tentativa</span>' : '';
    return `<div class="item" data-id="${b.id}"><span class="sw" style="background:var(--c${catOf(b)})"></span><div><b>${esc(b.n)}</b><small>${b.sin ? 'S/O' : 'Nº ' + b.id} · ${esc(b.norma)} · ${esc(b.loc)}</small></div>${tag}</div>`;
  }).join('') + (/^[ivx]+[\s\-\/]/i.test(q.trim()) ? `<div class="item" id="nomHint"><span></span><div><b>Buscar parcela «${esc(q)}»</b><small>Enter para ubicar la nomenclatura en el parcelario</small></div></div>` : '');
  $$('#mapList .item[data-id]').forEach(it => it.onclick = () => {
    const b = BY[it.dataset.id];
    if (located(b)) focusBien(b.id); else if (b.lst !== 'general') location.hash = '#/localizar/' + b.id; else location.hash = '#/ficha/' + b.id;
    if (innerWidth < 900) $('#side').classList.remove('open');
  });
  const h = $('#nomHint'); if (h) h.onclick = () => searchNomenclatura(q);
}
function focusBien(id) {
  const b = BY[id]; if (!b) return;
  if (!CAT_ON[catOf(b)]) { CAT_ON[catOf(b)] = 1; $(`#mapFilters .chip[data-c="${catOf(b)}"]`)?.classList.remove('off'); refreshBienes(); }
  const g = REFS[id]; if (!g) return;
  const bb = g.getBounds();
  if (bb.getNorthEast().distanceTo(bb.getSouthWest()) < 30) MAP.flyTo(bb.getCenter(), 18, { duration: .8 });
  else MAP.flyToBounds(bb.pad(.4), { maxZoom: 18, duration: .8 });
  setTimeout(() => g.openPopup(bb.getCenter()), 850);
  $$('#mapList .item').forEach(i => i.classList.toggle('sel', i.dataset.id === id));
}

/* layers */
async function toggleLayer(name, on) {
  if (name === 'bienes') { on ? LAYERS.bienes.addTo(MAP) : MAP.removeLayer(LAYERS.bienes); return; }
  if (!LAYERS[name] && on) await loadLayer(name);
  if (!LAYERS[name]) return;
  if (name === 'parcelario') { LAYERS.parcelario._wanted = on; parcelVisibility(); return; }
  on ? LAYERS[name].addTo(MAP) : MAP.removeLayer(LAYERS[name]);
}
function yearColor(y) {
  if (!y) return '#c9b98f';
  const t = Math.max(0, Math.min(1, (y - 1830) / (1925 - 1830)));
  const a = [184, 83, 46], c = [233, 196, 106], d = [63, 122, 85];
  const m = t < .5 ? a.map((v, i) => v + (c[i] - v) * t * 2) : c.map((v, i) => v + (d[i] - v) * (t - .5) * 2);
  return `rgb(${m.map(Math.round).join(',')})`;
}
async function loadLayer(name) {
  const note = $('#parcNote');
  if (name === 'parcelario') {
    note.textContent = 'cargando…';
    const gj = await fetch('data/parcelario.geojson').then(r => r.json());
    const rend = L.canvas({ padding: .3, pane: 'parcelas' });
    PARC_INDEX = [];
    LAYERS.parcelario = L.geoJSON(gj, {
      pane: 'parcelas', renderer: rend,
      style: { color: '#fdf6e3', weight: .8, opacity: .85, fillColor: '#fdf6e3', fillOpacity: .03 },
      onEachFeature: (f, l) => { PARC_INDEX.push(l); l.on('click', e => { L.DomEvent.stop(e); onParcelClick(f, l, e); }); }
    });
    note.textContent = '(desde zoom 14)';
  }
  if (name === 'mensuras') {
    const gj = await fetch('data/mensuras.geojson').then(r => r.json());
    const op = $('#mensOp').value / 100;
    LAYERS.mensuras = L.geoJSON(gj, {
      pane: 'mensuras',
      style: f => ({ color: yearColor(f.properties['AñO_DOMINI']), weight: 1.4, opacity: Math.min(1, op + .2), fillColor: yearColor(f.properties['AñO_DOMINI']), fillOpacity: op * .5 }),
      onEachFeature: (f, l) => {
        const p = f.properties;
        l.bindPopup(`<div class="pop"><h4>${esc(p.TITULAR || 'Sin titular')}</h4><div class="meta">Mensura histórica · AHGBA</div><table>
          <tr><td>Nº mensura</td><td>${esc(p['Nº_Mensura'])}</td></tr><tr><td>Año dominio</td><td>${p['AñO_DOMINI'] || '—'}</td></tr>
          <tr><td>Agrimensor</td><td>${esc(p.AGRIMENSOR || '—')}</td></tr><tr><td>Edificado</td><td>${esc(p.EDIFICADO || '—')}</td></tr>
          <tr><td>Superficie</td><td>${p.AREA ? (p.AREA / 10000).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' ha' : '—'}</td></tr></table></div>`);
      }
    });
  }
  if (name === 'caminos') {
    const gj = await fetch('data/caminos.geojson').then(r => r.json());
    LAYERS.caminos = L.geoJSON(gj, {
      pane: 'mensuras', style: { color: '#f4a259', weight: 2.4, dashArray: '6 4', opacity: .95 },
      onEachFeature: (f, l) => { const p = f.properties; l.bindTooltip(`${esc(p.NOMBRE || p.TIPO)}${p.UNION ? ' · ' + p.UNION : ''}`, { sticky: true }); l.bindPopup(`<div class="pop"><h4>${esc(p.NOMBRE || 'Camino')}</h4><div class="meta">${esc(p.TIPO || '')} · ${esc(p.OBSERVACIO || '')} · año ${esc(p.UNION || '—')}</div></div>`); }
    });
  }
  if (name === 'estancias') {
    const gj = await fetch('data/estancias.geojson').then(r => r.json());
    const col = t => ({ POSTA: '#e76f51', PULPERIA: '#e9c46a', PUESTO: '#8ab17d', TAPERA: '#9a8c73', RANCHO: '#c08552', IGLESIA: '#a893d6' }[t] || '#f1e3c6');
    LAYERS.estancias = L.geoJSON(gj, {
      pointToLayer: (f, ll) => L.circleMarker(ll, { pane: 'mensuras', radius: ['POSTA', 'PULPERIA', 'IGLESIA'].includes(f.properties.TIPO) ? 5.5 : 3.5, color: '#1f1a14', weight: .8, fillColor: col(f.properties.TIPO), fillOpacity: .95 }),
      onEachFeature: (f, l) => l.bindTooltip(`${esc(f.properties.TIPO)} · ${esc(f.properties.DESCRIPCIO)}`)
    });
  }
  renderLegend();
}
function parcelVisibility() {
  const l = LAYERS.parcelario; if (!l) return;
  const show = l._wanted && MAP.getZoom() >= 14;
  if (show && !MAP.hasLayer(l)) l.addTo(MAP); if (!show && MAP.hasLayer(l)) MAP.removeLayer(l);
}
function renderLegend() {
  const items = ['1', '2', '3', '4', '0'].map(c => `<span><i style="background:var(--c${c})"></i>${CATS[c].n}</span>`);
  items.push(`<span><i style="background:transparent;border:2px solid var(--accent);border-radius:50%"></i>Ubicación aproximada / propuesta</span>`);
  if (LAYERS.mensuras) items.push(`<span><i style="background:linear-gradient(90deg,${yearColor(1830)},${yearColor(1877)},${yearColor(1925)})"></i>Mensuras 1830 → 1925</span>`);
  if (LAYERS.caminos) items.push(`<span><i style="background:#f4a259;height:3px"></i>Caminos históricos</span>`);
  if (LAYERS.estancias) items.push(`<span><i style="background:#e76f51;border-radius:50%"></i>Posta · <i style="background:#e9c46a;border-radius:50%"></i>Pulpería · <i style="background:#8ab17d;border-radius:50%"></i>Puesto</span>`);
  $('#legend').innerHTML = items.join('');
}
function onParcelClick(f, l, e) {
  const p = f.properties;
  if (LOCATING) {
    const pop = L.popup().setLatLng(e.latlng).setContent(`<div class="pop"><h4>${esc(p.n || 'Parcela')}</h4><div class="meta">Partida ${esc(p.pda || '—')} · Zona ${esc(p.z || '—')}</div><button class="btn small primary" id="useParc">Asignar esta parcela a «${esc(BY[LOCATING].n.slice(0, 40))}»</button> <button class="btn small" id="usePt">Usar sólo el punto</button></div>`).openOn(MAP);
    setTimeout(() => {
      $('#useParc').onclick = () => { MAP.closePopup(pop); proposeGeom(f.geometry, 'Parcela ' + (p.n || p.pda || '')); };
      $('#usePt').onclick = () => { MAP.closePopup(pop); onMapClick({ latlng: e.latlng }); };
    }, 0);
    return;
  }
  const onBien = BIENES.filter(b => b.pc && p.n && b.pc.includes(p.n));
  L.popup().setLatLng(e.latlng).setContent(`<div class="pop"><h4>${esc(p.n || 'Parcela sin nomenclatura')}</h4><div class="meta">Parcelario 2024 · ${esc(p.t || '')}</div><table>
    <tr><td>Partida</td><td>${esc(p.pda || '—')}</td></tr><tr><td>Zona COU</td><td>${esc(p.z || '—')}</td></tr><tr><td>Superficie</td><td>${p.s ? p.s.toLocaleString('es-AR') + ' m²' : '—'}</td></tr></table>
    ${onBien.map(b => `<a class="btn small primary" href="#/ficha/${b.id}">${esc(b.n.slice(0, 40))}</a>`).join(' ')}</div>`).openOn(MAP);
}
async function searchNomenclatura(q) {
  const m = q.trim().toUpperCase().match(/^([IVX]+)[\s\-\/]+([A-D])?[\s\-\/]*(\d+[A-Z]?)?[\s\-\/]*(\d+\s?[A-Z]?)?$/);
  if (!m) return;
  if (!LAYERS.parcelario) { const cb = $('#layers input[data-l=parcelario]'); cb.checked = true; await toggleLayer('parcelario', true); }
  const [, c, s, mz, pc] = m;
  const want = l => { const n = l.feature.properties.n || ''; return n.startsWith('Circ. ' + c + ' ') || n === 'Circ. ' + c ? (!s || n.includes('Secc. ' + s)) && (!mz || new RegExp('Mz\\. ' + mz + '(\\s|$)').test(n)) && (!pc || new RegExp('Pc\\. ' + pc.replace(/\s/g, '') + '$').test(n)) : false; };
  let hits = PARC_INDEX.filter(want);
  if (!hits.length) { alert('No se encontró la nomenclatura ' + q + ' en el parcelario 2024. Revisá circunscripción, sección, manzana y parcela.'); return; }
  const fg = L.featureGroup(hits.map(h => L.geoJSON(h.feature.geometry)));
  if (HILITE) MAP.removeLayer(HILITE);
  HILITE = L.geoJSON({ type: 'FeatureCollection', features: hits.map(h => h.feature) }, { pane: 'bienes', interactive: false, style: { color: '#e9c46a', weight: 3, fillOpacity: .15 } }).addTo(MAP);
  LAYERS.parcelario._wanted = true;
  MAP.flyToBounds(fg.getBounds().pad(.5), { maxZoom: 19 });
  if (hits.length === 1) setTimeout(() => onParcelClick(hits[0].feature, hits[0], { latlng: fg.getBounds().getCenter() }), 900);
}

/* ------------ localización ------------ */
function startLocate(id) {
  const b = BY[id]; if (!b) return;
  LOCATING = id; document.body.classList.add('locating');
  const bar = $('#locateBar'); bar.hidden = false;
  bar.innerHTML = `<span><b>Localizando:</b> ${esc(b.n)}</span>
    <input type="search" id="geoQ" placeholder="Buscar dirección o esquina (ej. Mitre y Rivadavia)"> <button class="btn small" id="geoGo">Buscar</button>
    <span style="flex-basis:100%;font-size:.78rem;opacity:.8">Clic en el mapa para marcar un punto, o activá el Parcelario y hacé clic en la parcela. ${esc(b.ubi || '')}</span>
    <button class="btn small" id="locCancel">Cancelar</button>`;
  $('#locCancel').onclick = stopLocate;
  $('#geoGo').onclick = () => geocode($('#geoQ').value);
  $('#geoQ').onkeydown = e => { if (e.key === 'Enter') geocode(e.target.value); };
  // encuadre sugerido por localidad
  const LOCC = { 'Azcuénaga': [-34.3645, -59.3755, 16], 'Villa Espil': [-34.505, -59.338, 16], 'Villa Ruiz': [-34.435, -59.26, 15], 'Cucullú': [-34.445, -59.36, 15], 'Tuyutí': [-34.519, -59.675, 15], 'Solís': [-34.297, -59.322, 15], 'San Andrés de Giles': [-34.445, -59.447, 15] };
  const G = geomOf(b);
  if (G.g) focusBien(id); else { const c = LOCC[b.loc]; MAP.setView(c ? [c[0], c[1]] : [-34.42, -59.45], c ? c[2] : 12); }
}
function stopLocate() {
  LOCATING = null; document.body.classList.remove('locating'); $('#locateBar').hidden = true;
  if (TEMP) { MAP.removeLayer(TEMP); TEMP = null; }
  if (location.hash.startsWith('#/localizar')) history.replaceState(null, '', '#/mapa');
}
function onMapClick(e) {
  if (!LOCATING) return;
  const b = BY[LOCATING];
  if (TEMP) MAP.removeLayer(TEMP);
  TEMP = L.marker(e.latlng, { draggable: true }).addTo(MAP);
  const html = () => `<div class="pop"><h4>${esc(b.n)}</h4><div class="meta">${TEMP.getLatLng().lat.toFixed(6)}, ${TEMP.getLatLng().lng.toFixed(6)} — podés arrastrar el marcador</div><button class="btn small primary" id="savePt">Guardar esta ubicación</button></div>`;
  TEMP.bindPopup(html).openPopup();
  TEMP.on('dragend', () => TEMP.setPopupContent(html()).openPopup());
  MAP.once('popupopen', bindSave); TEMP.on('popupopen', bindSave); bindSave();
  function bindSave() { setTimeout(() => { const s = $('#savePt'); if (s) s.onclick = () => { const ll = TEMP.getLatLng(); proposeGeom({ type: 'Point', coordinates: [+ll.lng.toFixed(7), +ll.lat.toFixed(7)] }, 'Punto marcado en el mapa'); }; }, 0); }
}
function proposeGeom(geom, metodo) {
  const id = LOCATING; if (!id) return;
  LOCAL_LOC[id] = { geom, metodo, fecha: new Date().toISOString().slice(0, 10) };
  if (!store.set(LS_KEY, LOCAL_LOC)) alert('El navegador no permite guardar localmente: exportá el GeoJSON antes de cerrar la página.');
  stopLocate(); refreshBienes(); renderLocPanel(); renderInicio();
  setTimeout(() => focusBien(id), 100);
}
async function geocode(q) {
  if (!q) return;
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=ar&viewbox=-59.85,-34.2,-59.1,-34.7&bounded=1&q=' + encodeURIComponent(q.replace(/\by\b/i, '&') + ', San Andrés de Giles, Buenos Aires');
    let res = await fetch(url, { headers: { 'Accept-Language': 'es' } }).then(r => r.json());
    if (!res.length) res = await fetch(url.replace(/q=.*/, 'q=' + encodeURIComponent(q + ', Buenos Aires')), { headers: { 'Accept-Language': 'es' } }).then(r => r.json());
    if (!res.length) { alert('Sin resultados. Probá con otra forma de la dirección o marcá el punto a mano.'); return; }
    const r0 = res[0]; MAP.setView([+r0.lat, +r0.lon], 18);
    onMapClick({ latlng: L.latLng(+r0.lat, +r0.lon) });
  } catch { alert('El servicio de búsqueda no respondió. Marcá el punto a mano.'); }
}
function renderLocPanel() {
  const ids = Object.keys(LOCAL_LOC);
  const pend = BIENES.filter(b => !located(b) && b.lst !== 'general');
  $('#locPanel').innerHTML = `<b>Localizaciones</b> · ${pend.length} bienes sin ubicar${ids.length ? ` · <b>${ids.length}</b> propuesta${ids.length > 1 ? 's' : ''} guardada${ids.length > 1 ? 's' : ''} en este navegador` : ''}
    <div class="row">${pend.length ? `<button class="btn small" id="nextPend">Localizar el próximo</button>` : ''}
    ${ids.length ? `<button class="btn small primary" id="expLoc">Exportar GeoJSON</button><button class="btn small" id="clrLoc">Descartar</button>` : ''}</div>`;
  const np = $('#nextPend'); if (np) np.onclick = () => location.hash = '#/localizar/' + pend[0].id;
  const ex = $('#expLoc'); if (ex) ex.onclick = exportLoc;
  const cl = $('#clrLoc'); if (cl) cl.onclick = () => { if (confirm('¿Descartar las localizaciones propuestas en este navegador?')) { LOCAL_LOC = {}; store.set(LS_KEY, {}); refreshBienes(); renderLocPanel(); } };
}
function exportLoc() {
  const feats = Object.values(REPO_LOC).filter(f => !LOCAL_LOC[f.properties.id]);
  Object.entries(LOCAL_LOC).forEach(([id, v]) => feats.push({ type: 'Feature', properties: { id, nombre: BY[id]?.n, metodo: v.metodo, fecha: v.fecha }, geometry: v.geom }));
  const blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features: feats }, null, 1)], { type: 'application/geo+json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'localizaciones.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ------------ normativa ------------ */
function renderNormativa() {
  const cnt = {}; BIENES.filter(b => !b.sin).forEach(b => cnt[b.norma] = (cnt[b.norma] || 0) + 1);
  const rows = DATA.marco.slice().sort((a, b) => (+a.anio - +b.anio) || String(a.norma).localeCompare(b.norma, 'es', { numeric: true }));
  $('#normas').innerHTML = `<div class="tscroll"><table class="ntable"><thead><tr><th>Norma</th><th>Año</th><th>Carácter</th><th>Objeto</th><th>Asientos</th><th>Estado</th></tr></thead><tbody>${rows.map(r => {
    const n = cnt[r.norma] || 0;
    return `<tr><td class="n">${esc(r.norma.replace('Ordenanza ', 'Ord. '))}</td><td>${esc(r.anio)}<br><small class="muted">${esc(String(r.fecha || '').replace(/ \(.*/, ''))}</small></td><td><span class="k">${esc(r.caracter)}</span></td><td>${esc(r.objeto)}${r.deroga ? `<br><small class="muted">Deroga: ${esc(r.deroga)}</small>` : ''}${r.modif ? `<br><small class="muted">Modificada por: ${esc(r.modif)}</small>` : ''}</td><td>${n ? `<a class="cnt" href="#/fichas?q=${encodeURIComponent(r.norma)}">${n}</a>` : '—'}</td><td><small>${esc(r.estado)}</small></td></tr>`;
  }).join('')}</tbody></table></div>`;
  $('#desf').innerHTML = `<div class="tscroll"><table class="ntable"><thead><tr><th>Bien evaluado</th><th>Catastro</th><th>Dictamen</th><th>Resultado</th><th>Fundamento</th></tr></thead><tbody>${DATA.desf.map(d => `<tr><td>${esc(d['Inmueble / Bien Evaluado'])}<br><small class="muted">${esc(d['Ubicación'])}</small></td><td class="mono">${esc(d['Datos Catastrales'])}</td><td>${esc(d['Expediente / Dictamen'])}</td><td>${esc(d['Resultado Votación'])}</td><td>${esc(d['Fundamento del Rechazo'])}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ------------ acerca ------------ */
function renderAcerca() {
  const cnt = s => BIENES.filter(b => geomOf(b).st === s).length;
  $('#acerca').innerHTML = `
  <p class="kicker">Método y hallazgos</p><h1>Cómo se construyó este registro</h1>
  <p>El inventario reproduce el <b>Registro Oficial del Patrimonio Cultural de San Andrés de Giles</b> (Ord. 2182/19, art. 8º), reconstruido a partir del texto de cada ordenanza declaratoria del H.C.D.: un asiento por bien e inciso. Los 12 asientos cuyo respaldo es un dictamen, un decreto o una norma de otra jurisdicción se muestran aparte, como «sin ordenanza».</p>
  <h2>Localización</h2>
  <table><tr><th>Estado</th><th>Criterio</th><th>Bienes</th></tr>
  <tr><td>${LST.kml}</td><td>Polígonos y puntos del KML «Lugares históricos declarados», vinculados a cada asiento por denominación y catastro.</td><td>${cnt('kml')}</td></tr>
  <tr><td>${LST.parcela}</td><td>Nomenclatura catastral del texto de la ordenanza o de la documentación de la Comisión, cruzada con el parcelario ARBA/COU 2024.</td><td>${cnt('parcela') + cnt('coord')}</td></tr>
  <tr><td>${LST.planilla}</td><td>Nomenclatura tomada de la planilla 2024, sin respaldo en el texto normativo: se dibuja con borde punteado.</td><td>${cnt('planilla')}</td></tr>
  <tr><td>${LST.aprox}</td><td>Bienes muebles ubicados en su sede de resguardo, sepulcros en el Cementerio Norte, equipamientos parcialmente relevados.</td><td>${cnt('aprox')}</td></tr>
  <tr><td>${LST.tentativa}</td><td>Hipótesis a partir de las mensuras históricas del AHGBA (Posta de Rodríguez).</td><td>${cnt('tentativa')}</td></tr>
  <tr><td>${LST.pendiente}</td><td>El instrumento no permite ubicarlos: se localizan desde el propio mapa.</td><td>${BIENES.filter(b => !located(b) && b.lst !== 'general').length}</td></tr></table>
  <h2>Cómo localizar un bien pendiente</h2>
  <ol><li>En el mapa o en la ficha, elegí <b>Localizar este bien</b>.</li>
  <li>Buscá la dirección o esquina, hacé clic en el terreno (el marcador se puede arrastrar) o activá el <b>Parcelario 2024</b> y hacé clic en la parcela. También podés escribir una nomenclatura (p. ej. <code>I-A-95-2</code>) en el buscador del mapa.</li>
  <li>La propuesta se guarda en este navegador. Con <b>Exportar GeoJSON</b> se descarga <code>localizaciones.json</code>.</li>
  <li>Para publicarla para todos, reemplazá <code>data/localizaciones.json</code> en el repositorio de GitHub con el archivo exportado (incluye las localizaciones ya publicadas más las nuevas).</li></ol>
  <h2>Hallazgos de la investigación</h2>
  <ul>
  <li><b>Sepulcro Histórico Nacional no registrado.</b> La tumba de Enrique José de Larrañaga (asiento 19) fue declarada Sepulcro Histórico Nacional por Decreto 633/2017; el registro sólo consigna la Ord. 119/88. La ordenanza además fecha su muerte en 1957; las fuentes nacionales indican 1956.</li>
  <li><b>Triple protección de la Posta de Figueroa.</b> Además de la Ord. 49/88 y el Dec. PEN 616/21, es Monumento Histórico Provincial por Ley 10.965 (1990).</li>
  <li><b>Catastros cruzados en la planilla 2024.</b> Las escuelas Nº 1 (SAG), Nº 8 (Solís) y Nº 5 (Cucullú) comparten el mismo catastro (Circ. IX, Secc. B, Mz. 12, Pc. 41) y la misma observación; el KML permite reasignar las dos primeras.</li>
  <li><b>Declaratorias dobles.</b> Monumento a Mitre (9 y 32), Estatua del Sembrador (31 y 51) y Monumento a Malvinas (30, 61 y entorno 99) están inscriptos más de una vez: conviene unificarlos con referencias cruzadas.</li>
  <li><b>Catastro del Club Almafuerte.</b> La reseña de la Comisión consigna I-A-81-2B (Partida ARBA 3092), dato ausente en el registro.</li>
  <li><b>Coordenadas del Rancho VI-631W</b> en la documentación de la reunión del 10/02/2021, incorporadas al mapa.</li>
  <li><b>La Paterna de la Cañada de la Cruz</b> aparece como «La Paterna» en el registro de casas y puestos de las mensuras históricas, coincidente con el polígono declarado.</li>
  <li><b>Casa Dr. Ruggiero.</b> La carpeta de la Comisión contiene el Expte. 4101-11093-0-2021 de incorporación al Registro Preventivo, que no tiene asiento en el Registro Oficial.</li></ul>
  <h2>Fuentes de datos</h2>
  <ul><li>Registro Oficial del Patrimonio Cultural de SAG (planilla Excel, 2026).</li><li>KML «Lugares históricos declarados».</li>
  <li>Parcelario SAG 2024 con zonificación COU (EPSG:22185, reproyectado a WGS84). <b>Se eliminaron nombres de titulares y domicilios</b>: sólo se publica nomenclatura, partida, zona y superficie.</li>
  <li>Mensuras, caminos y estancias/puestos del Archivo Histórico de Geodesia de la Provincia de Buenos Aires (AHGBA).</li>
  <li>Textos de ordenanzas publicados por el H.C.D.; fichas de la Comisión Nacional de Monumentos; archivo de la CMAPCSAG; prensa local y regional (citada en cada ficha).</li></ul>
  <h2>Preguntas abiertas</h2>
  <p>El registro protege sobre todo edificios del casco y objetos donados; el paisaje rural —postas, caminos, montes, ranchos— aparece apenas en unos pocos asientos, aunque las mensuras muestran una trama densa de pulperías, puestos y postas. ¿Qué lugar ocupa el territorio pampeano como bien en sí mismo, más allá de sus edificios? ¿Y cómo se sostiene una protección cuyo cumplimiento (notificación al titular, señalización, estímulos fiscales) casi no está documentado?</p>`;
}

boot().catch(err => { console.error(err); document.getElementById('main').insertAdjacentHTML('afterbegin', `<div class="wrap"><div class="box warn"><b>No se pudieron cargar los datos.</b> Si abriste el archivo localmente, serví la carpeta con un servidor (por ejemplo <code>python -m http.server</code>) o publicala en GitHub Pages.</div></div>`); });
})();
