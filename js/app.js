/* Registro del Patrimonio Cultural · San Andrés de Giles
   App estática para GitHub Pages — Leaflet 1.9 */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
  general: 'Alcance general', pendiente: 'Sin localizar', comision: 'Localización del Registro Oficial'
};

const MODOS = {
  walk: { id: 'walk', n: 'Peatonal', icon: '🚶', vel: 4.5, stopMin: 6, color: '#2a9d8f', weight: 4.5, dash: '6 6', profile: 'foot', desc: 'A pie (calles y veredas peatonales)' },
  bike: { id: 'bike', n: 'Bicicleta', icon: '🚲', vel: 14, stopMin: 8, color: '#e9c46a', weight: 4.5, dash: '8 4', profile: 'bicycle', desc: 'En bicicleta (calles y caminos rurales)' },
  moto: { id: 'moto', n: 'Moto', icon: '🏍️', vel: 45, stopMin: 10, color: '#e76f51', weight: 5, dash: null, profile: 'driving', desc: 'En moto (recorrido ágil urbano y rural)' },
  car: { id: 'car', n: 'Auto', icon: '🚗', vel: 40, stopMin: 12, color: '#233b2f', weight: 5.5, dash: null, profile: 'driving', desc: 'En auto (rutas pavimentadas y calles consolidadas)' }
};

const CIRCUITOS = [
  {
    id: 'casco',
    nombre: 'Casco Histórico y Trazado Fundacional',
    loc: 'San Andrés de Giles (Casco Urbano)',
    defaultModo: 'walk',
    desc: 'Recorrido por el centro cívico e histórico trazado en torno a la donación fundacional de 1793 y el Pbro. Vicente Piñero. Visita la plaza principal, templos, monumentos emblemáticos y la arquitectura cívica de fines del siglo XIX.',
    bienes: ['2', '6', '3', '4', '7', '5', '15', '11', '8']
  },
  {
    id: 'azcuenaga',
    nombre: 'Casco Rural y Estación de Azcuénaga',
    loc: 'Azcuénaga',
    defaultModo: 'walk',
    desc: 'Caminata patrimonial por el pueblo rural y polo gastronómico de Azcuénaga, destacando su centenaria estación de ferrocarril Mitre, capilla, clubes sociales, antiguas fondas, panaderías a leña y almacenes de ramos generales.',
    bienes: ['12', '27', '35', '37', '54', '62', '63', '43', '69', '70', '71']
  },
  {
    id: 'camino_real',
    nombre: 'Postas Coloniales y Antiguo Camino Real',
    loc: 'Área rural, Cucullú y Villa Ruiz',
    defaultModo: 'car',
    desc: 'Itinerario histórico-territorial sobre la traza del Camino Real al Alto Perú y las mensuras del siglo XIX. Incluye la célebre Posta de Figueroa (Monumento Histórico Nacional, donde Rosas redactó la Carta de Figueroa en 1834), la Posta de Rodríguez en Cucullú, la Estación de Villa Ruiz y estancias coloniales.',
    bienes: ['1', '47', '102', '103', '13', '14']
  },
  {
    id: 'memoria',
    nombre: 'Memoria Cívica, Malvinas y Monumentos Simbólicos',
    loc: 'San Andrés de Giles',
    defaultModo: 'bike',
    desc: 'Circuito que conecta los hitos conmemorativos del pueblo: el Monumento y Plaza Saraví de la emblemática Vigilia de Malvinas, la pirámide de la Libertad, el Cementerio Sud del siglo XIX, las tumbas históricas de Larrañaga, Marcos Alvis y Cámpora, y el Hito Inicial Fundacional.',
    bienes: ['82', '2', '6', '9', '10', '11', '19', '22', '92']
  },
  {
    id: 'pueblos',
    nombre: 'Gran Circuito de los Pueblos y Parajes Rurales',
    loc: 'Todo el Partido de San Andrés de Giles',
    defaultModo: 'car',
    desc: 'Travesía por la identidad rural del partido de Giles: los hornos alfareros de Cucullú, la estación y casona de Villa Espil, las escuelas centenarias de Solís, la arquitectura ferroviaria de Azcuénaga, la tradición del Camino Real en Villa Ruiz y la Posta de Figueroa.',
    bienes: ['2', '41', '47', '83', '84', '26', '12', '37', '102', '103', '1']
  }
];

const CELEBRACIONES = [
  {
    id: 'carnavales',
    nombre: 'Carnavales y Corsos Populares de Giles y los Pueblos',
    fecha: 'Febrero (Fin de semana de Carnaval)',
    mes: 2,
    tipo: 'Fiesta popular',
    loc: 'San Andrés de Giles y parajes rurales',
    desc: 'Festejos comunitarios con murgas, comparsas, desfiles de disfraces y baile popular en torno a los clubes de barrio y avenidas céntricas.',
    bienesIds: ['2'],
    sede: 'Plaza San Martín y corsódromo cívico'
  },
  {
    id: 'patronales_solis',
    nombre: 'Fiestas Patronales de Nuestra Señora de Lourdes',
    fecha: '11 de Febrero',
    mes: 2,
    tipo: 'Fiesta patronal',
    loc: 'Solís',
    desc: 'Misa patronal, procesión comunitaria y encuentro de vecinos en la localidad de Solís, con actividades culturales en el predio escolar.',
    bienesIds: ['26'],
    sede: 'Capilla de Solís y Escuela Nº 8'
  },
  {
    id: 'patronales_azcuenaga',
    nombre: 'Fiestas Patronales de San José',
    fecha: '19 de Marzo',
    mes: 3,
    tipo: 'Fiesta patronal',
    loc: 'Azcuénaga',
    desc: 'Celebración religiosa y criolla en la Capilla Nuestra Señora del Rosario y la plaza del pueblo de Azcuénaga, con almuerzo comunitario y música folclórica.',
    bienesIds: ['27', '12'],
    sede: 'Capilla Ntra. Sra. del Rosario y Plaza de Azcuénaga'
  },
  {
    id: 'vigilia_malvinas',
    nombre: 'Vigilia de Malvinas y Fogón Criollo «Giles te Canta a Malvinas»',
    fecha: '1 y 2 de Abril',
    mes: 4,
    tipo: 'Patrimonio inmaterial',
    loc: 'San Andrés de Giles',
    desc: 'Declarado Patrimonio Cultural Inmaterial (Ord. 2446/21). Homenaje ininterrumpido desde 1997 a los héroes de Malvinas en la Plaza Saraví: vigilia nocturna, encendido de fogón criollo, desfile cívico-militar y peña de canto popular con delegaciones de todo el país.',
    bienesIds: ['82'],
    sede: 'Plaza Saraví y Monumento a los Caídos'
  },
  {
    id: 'rosas_figueroa',
    nombre: 'Efeméride: Visita de Juan Manuel de Rosas a la Posta de Figueroa',
    fecha: 'Abril de 1831',
    mes: 4,
    tipo: 'Efeméride histórica',
    loc: 'San Andrés de Giles',
    desc: 'Conmemoración del paso y estadía del Brigadier General Juan Manuel de Rosas por el casco de la estancia La Merced / Posta de Figueroa durante los sucesos de la Confederación Argentina.',
    bienesIds: ['1'],
    sede: 'Casco de la Estancia La Merced (MHN)'
  },
  {
    id: 'patronales_espil',
    nombre: 'Fiestas Patronales de San Felipe y Santiago',
    fecha: '3 de Mayo',
    mes: 5,
    tipo: 'Fiesta patronal',
    loc: 'Villa Espil',
    desc: 'Festividad patronal comunitaria en el pueblo rural de Villa Espil, junto a la estación y las dependencias históricas municipales.',
    bienesIds: ['83', '84'],
    sede: 'Capilla San Felipe y Santiago de Villa Espil'
  },
  {
    id: 'revolucion_mayo',
    nombre: 'Celebración Patria del 25 de Mayo',
    fecha: '25 de Mayo',
    mes: 5,
    tipo: 'Efeméride histórica',
    loc: 'San Andrés de Giles',
    desc: 'Acto protocolar, solemne Tedeum en el Templo Parroquial, izamiento en el Monumento a la Libertad y tradicional chocolate patrio en el Palacio Municipal.',
    bienesIds: ['2', '3', '4', '6'],
    sede: 'Plaza San Martín y Templo Parroquial'
  },
  {
    id: 'independencia',
    nombre: 'Día de la Independencia y Desfile Criollo del 9 de Julio',
    fecha: '9 de Julio',
    mes: 7,
    tipo: 'Fiesta popular',
    loc: 'San Andrés de Giles',
    desc: 'Gran desfile de centros tradicionalistas a caballo, tropillas entabladas, payadas y peña folclórica en las calles del casco céntrico.',
    bienesIds: ['2', '4', '6'],
    sede: 'Plaza San Martín'
  },
  {
    id: 'patronales_cucullu',
    nombre: 'Fiestas Patronales de Santa Elena',
    fecha: '18 de Agosto',
    mes: 8,
    tipo: 'Fiesta patronal',
    loc: 'Cucullú',
    desc: 'Celebración de la santa patrona de Cucullú, pueblo de tradición ladrillera y alfarera, con procesión, kermés y almuerzo criollo.',
    bienesIds: ['41'],
    sede: 'Capilla Santa Elena y Club de Cucullú'
  },
  {
    id: 'fiesta_hornero',
    nombre: 'Fiesta del Hornero de Cucullú',
    fecha: 'Septiembre',
    mes: 9,
    tipo: 'Fiesta popular',
    loc: 'Cucullú',
    desc: 'Tributo cultural y comunitario al oficio de los hornos ladrilleros artesanales de barro y fuego de Cucullú. Elaboración de ladrillo en vivo, desfile gaucho, gastronomía criolla al horno de barro y espectáculos musicales.',
    bienesIds: ['41', '47'],
    sede: 'Predio comunitario de Cucullú'
  },
  {
    id: 'fiesta_galleta',
    nombre: 'Fiesta Provincial de la Galleta de Campo',
    fecha: 'Octubre',
    mes: 10,
    tipo: 'Fiesta popular',
    loc: 'Azcuénaga',
    desc: 'Emblemática fiesta gastronómica y turística bonaerense en torno a la estación histórica de Azcuénaga. Competencia de panaderías tradicionales con horno a leña, degustación de la auténtica galleta de campo, artesanos y música en vivo.',
    bienesIds: ['12', '37', '43'],
    sede: 'Predio de la Estación Ferroviaria de Azcuénaga'
  },
  {
    id: 'patronales_sag',
    nombre: 'Fiestas Patronales de San Andrés Apóstol y Aniversario Fundacional',
    fecha: '30 de Noviembre',
    mes: 11,
    tipo: 'Fiesta patronal',
    loc: 'San Andrés de Giles',
    desc: 'El evento histórico y cívico más trascendente del Partido: conmemoración del origen del pueblo (1806) y fiesta del Santo Patrono. Misa mayor, procesión, feria de artesanos, espectáculos centrales y homenaje en el Hito Inicial Fundacional.',
    bienesIds: ['2', '3', '4', '6', '11'],
    sede: 'Plaza San Martín y Templo Parroquial'
  },
  {
    id: 'fiesta_camino_real',
    nombre: 'Fiesta del Camino Real en Villa Ruiz',
    fecha: 'Noviembre',
    mes: 11,
    tipo: 'Patrimonio inmaterial',
    loc: 'Villa Ruiz',
    desc: 'Declarada Patrimonio Cultural Inmaterial (Ord. 2404/21). Evocación histórica del Camino Real a Chile y al Alto Perú: desfile de carruajes de época, tropillas, vestimentas coloniales y tradicionales, pulpería abierta y fogón criollo.',
    bienesIds: ['103', '102'],
    sede: 'Predio de la Estación y casco de Villa Ruiz'
  },
  {
    id: 'noche_museos',
    nombre: 'La Noche de los Museos y Sitios Patrimoniales',
    fecha: 'Noviembre',
    mes: 11,
    tipo: 'Patrimonio inmaterial',
    loc: 'San Andrés de Giles y localidades',
    desc: 'Apertura nocturna con visitas guiadas especiales y actividades artísticas en el Templo Parroquial, la Pinacoteca Municipal, edificios cívicos históricos y postas coloniales.',
    bienesIds: ['3', '4', '7', '1'],
    sede: 'Circuito de museos y salas patrimoniales'
  },
  {
    id: 'carta_figueroa',
    nombre: 'Efeméride: Redacción de la «Carta de la Hacienda de Figueroa»',
    fecha: '20 de Diciembre de 1834',
    mes: 12,
    tipo: 'Efeméride histórica',
    loc: 'San Andrés de Giles',
    desc: 'Hito fundacional del pensamiento político nacional: el 20 de diciembre de 1834, en el casco de la Estancia La Merced, Juan Manuel de Rosas redacta su célebre carta a Facundo Quiroga fundamentando las bases previas a la Constitución Nacional.',
    bienesIds: ['1'],
    sede: 'Posta de Figueroa (MHN)'
  }
];

const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const catOf = b => b.sin ? '0' : (b.cats[0] || '1');
const colorOf = b => cssVar('--c' + catOf(b));

let DATA, BIENES = [], BY = {}, REPO_LOC = {};
let ACTIVE_ITIN = null, ITIN_LAYER = null, ITIN_STEP_IDX = 0;
let MEASURING = false, MEASURE_POINTS = [], MEASURE_LAYER = null;
let GPS_WATCH_ID = null, GPS_LAYER = null, USER_POS = null;

/* ------------ effective geometry ------------ */
function geomOf(b) {
  if (REPO_LOC[b.id]) return { g: [REPO_LOC[b.id].geometry], st: 'comision', src: 'Registro Oficial' + (REPO_LOC[b.id].properties.metodo ? ' · ' + REPO_LOC[b.id].properties.metodo : '') };
  if (b.g) return { g: b.g, st: b.lst, src: b.lsrc };
  return { g: null, st: b.lst, src: null };
}
const located = b => !!geomOf(b).g;
function ptOf(b) {
  const G = geomOf(b).g; if (!G) return null;
  const g = G[0];
  if (g.type === 'Point') return [g.coordinates[1], g.coordinates[0]];
  if (g.type === 'MultiPoint') return [g.coordinates[0][1], g.coordinates[0][0]];
  if (b.pt && !REPO_LOC[b.id]) return [b.pt[1], b.pt[0]];
  const c = L.geoJSON(g).getBounds().getCenter(); return [c.lat, c.lng];
}

/* ------------ boot ------------ */
async function boot() {
  initTheme();
  const [reg, loc] = await Promise.all([
    fetch('data/registro.json').then(r => {
      if (!r.ok) throw new Error('Error al cargar data/registro.json (HTTP ' + r.status + ')');
      return r.json();
    }),
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
  const view = { inicio: 'inicio', mapa: 'mapa', fichas: 'fichas', ficha: 'ficha', itinerarios: 'itinerarios', calendario: 'calendario', normativa: 'normativa', acerca: 'acerca' }[r] || 'inicio';
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + view));
  $$('.tabs a, .bottom-nav a').forEach(t => t.classList.toggle('on', t.dataset.r === (view === 'ficha' ? 'fichas' : view)));
  document.body.classList.toggle('map-on', view === 'mapa');
  if (view === 'mapa') {
    initMap();
    setTimeout(() => MAP.invalidateSize(), 50);
    if (q.get('itinerario')) loadItineraryOnMap(q.get('itinerario'), q.get('modo') || 'walk');
    else if (a) focusBien(a);
  }
  if (view === 'fichas') { if (q.get('q')) $('#fSearch').value = q.get('q'); renderCards(); }
  if (view === 'ficha') renderFicha(a);
  if (view === 'itinerarios') renderItinerarios();
  if (view === 'calendario') renderCalendario();
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
    ['Bienes geolocalizados', loc], ['Alcance general', 1], ['Desde', '1988']
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
  ['#fSearch', '#fLoc', '#fCat', '#fTipo', '#fLst', '#fEstado', '#fEpoca', '#fSin'].forEach(s => {
    const el = $(s); if (el) el.addEventListener('input', renderCards);
  });
  const rst = $('#fReset');
  if (rst) {
    rst.onclick = () => {
      $('#fSearch').value = '';
      $('#fLoc').value = '';
      $('#fCat').value = '';
      $('#fTipo').value = '';
      $('#fLst').value = '';
      if ($('#fEstado')) $('#fEstado').value = '';
      if ($('#fEpoca')) $('#fEpoca').value = '';
      $('#fSin').checked = false;
      renderCards();
    };
  }
}
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function matchText(b, q) {
  if (!q) return true;
  const hay = norm([b.id, b.n, b.ubi, b.locRaw, b.norma, b.cat, b.fig, b.res, b.fund, b.obs, b.tipo].join(' '));
  return norm(q).split(/\s+/).every(t => hay.includes(t));
}
function filtered() {
  const q = $('#fSearch').value, l = $('#fLoc').value, c = $('#fCat').value, t = $('#fTipo').value, s = $('#fLst').value, sin = $('#fSin').checked;
  const est = $('#fEstado')?.value || '';
  const ep = $('#fEpoca')?.value || '';
  return BIENES.filter(b => (sin || !b.sin) && matchText(b, q) && (!l || b.loc === l) && (!c || b.cats.includes(c)) && (!t || b.tipo === t) &&
    (!s || (s === 'si' ? located(b) : s === 'no' ? !located(b) : b.fotos.length)) &&
    (!est || (est === 'sin' ? b.sin : b.estado === est)) &&
    (!ep || (ep === '1988-1999' ? (+b.anio >= 1988 && +b.anio <= 1999) : ep === '2000-2018' ? (+b.anio >= 2000 && +b.anio <= 2018) : (+b.anio >= 2019))));
}
function cardHTML(b) {
  const c = catOf(b);
  const p = located(b) ? ptOf(b) : null;
  const th = (b.fotos.length && b.fotos[0].src) ? `<img loading="lazy" src="${b.fotos[0].src}" alt="" onerror="this.style.display='none'">` :
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
    <button class="btn small" id="shareFichaBtn" title="Compartir o copiar enlace">Compartir</button>
    <button class="btn small" onclick="window.print()">Imprimir ficha</button></span></nav>
  <header class="fhead"><div>
    <p class="kicker">Ficha patrimonial · ${b.sin ? 'Asiento sin ordenanza (planilla 2024 Nº ' + b.id.slice(1) + ')' : 'Registro Oficial Nº ' + b.id}</p>
    <h1>${esc(b.n)}</h1>
    <div class="cc">${b.sin ? '<span class="pill c0">Sin ordenanza</span>' : b.cats.map(k => `<span class="pill c${k}">${CATS[k].n}</span>`).join(' ')}
    <span class="pill ghost">${esc(b.estado)}</span>${b.alta ? '<span class="pill ghost">Alta 2026</span>' : ''}</div>
  </div><div class="fid">${b.sin ? 'S/O' : b.id}</div></header>
  <div class="fgrid"><div>
    ${b.fotos.length ? `<div class="gal">${b.fotos.map(f => `<figure data-src="${f.src}" data-cap="${esc(f.cap)}"><img loading="lazy" src="${f.src}" alt="${esc(f.cap)}" onerror="this.parentElement.style.display='none'"><figcaption>${esc(f.cap)}</figcaption></figure>`).join('')}</div>` : ''}
    ${b.res ? `<p class="res">${esc(b.res)}</p>` : ''}
    ${b.datos.length ? `<ul class="keys">${b.datos.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
    ${b.fund ? `<h3>Fundamento del valor patrimonial (texto del registro)</h3><p>${esc(b.fund)}</p>` : ''}
    ${b.obs ? `<h3>Observaciones</h3><p>${esc(b.obs)}</p>` : ''}
    ${b.corr ? `<div class="box warn"><b>Corrección de cita.</b> ${esc(b.corr)}</div>` : ''}
    ${b.fuentes.length ? `<h3>Fuentes consultadas</h3><ol class="src">${b.fuentes.map(f => `<li>${f.u ? `<a href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.t)}</a>` : esc(f.t)}</li>`).join('')}</ol>` : ''}
  </div><aside>
    <h3>Localización</h3>
    ${G.g ? `<div class="minimap" id="mini"></div><p class="lsrc"><b>${LST[G.st] || ''}</b>${G.src ? ' — ' + esc(G.src) : ''}</p>
    <p class="no-print"><a class="btn small primary" href="#/mapa/${b.id}">Ver en el mapa</a> <a class="btn small" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${(ptOf(b) || [0,0])[0]},${(ptOf(b) || [0,0])[1]}">Cómo llegar (GPS)</a></p>`
    : `<div class="box">Bien de alcance general territorial en todo el Partido.</div>`}
    <h3>Identificación</h3>
    <dl class="dl">${row('Localidad', esc(b.locRaw))}${row('Ubicación', esc(b.ubi))}${row('Catastro', esc(b.cat), 1)}${row('Fuente catastro', esc(b.catSrc))}${row('Parcela vinculada', esc(b.pc), 1)}${row('Tipo de bien', esc(b.tipo))}${row('Categoría', esc(b.catTxt))}</dl>
    <h3>Instrumento</h3>
    <dl class="dl">${row('Norma de origen', esc(b.norma))}${row('Artículo / inciso', esc(b.art))}${row('Año', esc(b.anio))}${row('Figura de origen', esc(b.fig))}${row('Estado registral', esc(b.estado))}${row('Expediente', esc(b.exp), 1)}${row('Dictamen CMAPCSAG', esc(b.dict))}${row('Régimen', esc(b.reg))}</dl>
  </aside></div>`;
  const shBtn = $('#shareFichaBtn', el); if (shBtn) shBtn.onclick = () => shareFicha(b);
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
let MAP, BASES, LAYERS = {}, REFS = {}, CAT_ON = { '1': 1, '2': 1, '3': 1, '4': 1, '0': 1 }, TEMP = null, PARC_INDEX = null, HILITE = null;
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
  MAP.on('click', e => { if (MEASURING) { onMeasureClick(e); return; } onMapClick(e); });
  const gpsBtn = $('#gpsBtn'); if (gpsBtn) gpsBtn.onclick = toggleGPS;
  const measBtn = $('#measureBtn'); if (measBtn) measBtn.onclick = toggleMeasure;
  const expBtn = $('#exportBtn'); if (expBtn) expBtn.onclick = showExportMenu;
  MAP.on('zoomend', parcelVisibility);
  renderLegend();
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
  ${b.fotos[0] ? `<img src="${b.fotos[0].src}" alt="" onerror="this.style.display='none'" style="border-radius:8px;margin-bottom:8px;aspect-ratio:16/9;object-fit:cover">` : ''}
  <div>${esc((b.res || b.fund || '').slice(0, 220))}${(b.res || b.fund || '').length > 220 ? '…' : ''}</div>
  <div class="meta" style="margin-top:6px">${LST[G.st] || ''}</div>
  <a class="btn small primary" href="#/ficha/${b.id}">Ver ficha</a> <a class="btn small" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${(ptOf(b) || [0,0])[0]},${(ptOf(b) || [0,0])[1]}">Cómo llegar</a></div>`;
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
    if (located(b)) focusBien(b.id); else location.hash = '#/ficha/' + b.id;
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

/* Localización oficial integrada en el registro */

function exportGeoJSON(list) {
  const feats = [];
  list.filter(located).forEach(b => {
    const G = geomOf(b);
    if (!G || !G.g) return;
    G.g.forEach(geom => {
      feats.push({
        type: 'Feature',
        geometry: geom,
        properties: {
          id: b.id,
          nombre: b.n,
          localidad: b.locRaw || b.loc,
          ubicacion: b.ubi,
          catastro: b.cat,
          norma: b.norma,
          anio: b.anio,
          tipo: b.tipo,
          categoria: b.catTxt,
          estado: b.estado,
          fundamento: b.fund
        }
      });
    });
  });
  const data = JSON.stringify({ type: 'FeatureCollection', features: feats }, null, 2);
  downloadBlob(data, 'patrimonio_cultural_sag.geojson', 'application/geo+json');
  showToast('GeoJSON descargado con éxito');
}

function exportKML(list) {
  let placemarks = '';
  list.filter(located).forEach(b => {
    const p = ptOf(b);
    if (!p) return;
    placemarks += `  <Placemark>
    <name>${esc(b.n)}</name>
    <description><![CDATA[<b>${esc(b.norma)} (${esc(b.anio)})</b><br>${esc(b.loc)} · ${esc(b.tipo)}<br><p>${esc(b.res || b.fund || '')}</p>]]></description>
    <Point>
      <coordinates>${p[1]},${p[0]},0</coordinates>
    </Point>
  </Placemark>
`;
  });
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Patrimonio Cultural - San Andres de Giles</name>
    <description>Bienes declarados del Partido de San Andres de Giles (Ord. 2182/19)</description>
${placemarks}  </Document>
</kml>`;
  downloadBlob(kml, 'patrimonio_cultural_sag.kml', 'application/vnd.google-earth.kml+xml');
  showToast('KML descargado con éxito');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

/* ------------ share ficha ------------ */
function shareFicha(b) {
  const url = `${window.location.origin}${window.location.pathname}#/ficha/${b.id}`;
  if (navigator.share) {
    navigator.share({
      title: `${b.n} · Patrimonio Cultural SAG`,
      text: `Conocé la ficha de ${b.n} (${b.norma}) en el Registro Oficial del Patrimonio de San Andrés de Giles.`,
      url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Enlace copiado al portapapeles');
    }).catch(() => {
      prompt('Copiá el enlace a esta ficha:', url);
    });
  }
}

/* ------------ itinerarios ------------ */
function renderItinerarios() {
  $$('.itin-tab-btn').forEach(btn => {
    btn.onclick = () => {
      $$('.itin-tab-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      $$('.itin-tab-content').forEach(c => c.classList.remove('on'));
      const target = $('#itab-' + btn.dataset.itab);
      if (target) target.classList.add('on');
    };
  });
  
  const curList = $('#curatedList');
  if (curList) {
    curList.innerHTML = CIRCUITOS.map(c => {
      const stopsHtml = c.bienes.slice(0, 4).map((bid, i) => {
        const b = BY[bid];
        return b ? `<li><span class="step-n">${i+1}</span> <span>${esc(b.n)}</span></li>` : '';
      }).join('');
      const moreCount = c.bienes.length > 4 ? `<li><small class="muted">+ ${c.bienes.length - 4} paradas más…</small></li>` : '';
      
      return `<article class="itin-card">
        <div class="itin-card-head">
          <div class="itin-badge-strip">
            <span class="itin-badge accent">${esc(c.modo)}</span>
            <span class="itin-badge">${esc(c.dist)}</span>
            <span class="itin-badge">⏱ ${esc(c.duracion)}</span>
            <span class="itin-badge">${c.bienes.length} paradas</span>
          </div>
          <h3>${esc(c.nombre)}</h3>
          <small class="muted">${esc(c.loc)}</small>
        </div>
        <div class="itin-card-body">
          <p>${esc(c.desc)}</p>
          <div class="itin-stops-preview">
            <b>Principales paradas:</b>
            <ul class="itin-stops-list">${stopsHtml}${moreCount}</ul>
          </div>
        </div>
        <div class="itin-card-foot">
          <a class="btn primary small" href="#/mapa?itinerario=${c.id}">Recorrer en el mapa</a>
        </div>
      </article>`;
    }).join('');
  }
  
  const genBtn = $('#genBtn');
  if (genBtn && !genBtn._bound) {
    genBtn._bound = true;
    genBtn.onclick = generateCustomItinerary;
  }
}

function generateCustomItinerary() {
  const loc = $('#genLoc').value;
  const modo = $('#genModo').value;
  const cat = $('#genCat').value;
  const max = +$('#genCount').value || 8;
  
  let candidates = BIENES.filter(b => located(b) && (!loc || b.loc === loc) && (!cat || b.cats.includes(cat)));
  if (!candidates.length) {
    alert('No se encontraron sitios patrimoniales localizados con esos criterios. Probá ampliando la localidad o categorías.');
    return;
  }
  
  const stops = [];
  let remaining = candidates.slice();
  let current = remaining.shift();
  stops.push(current);
  
  while (remaining.length && stops.length < max) {
    const p1 = ptOf(current);
    let bestIdx = 0, bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const p2 = ptOf(remaining[i]);
      const d = calcDistance(p1[0], p1[1], p2[0], p2[1]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    current = remaining.splice(bestIdx, 1)[0];
    stops.push(current);
  }
  
  let totalMeters = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const p1 = ptOf(stops[i]), p2 = ptOf(stops[i+1]);
    totalMeters += calcDistance(p1[0], p1[1], p2[0], p2[1]);
  }
  
  const speedKmH = modo === 'walk' ? 4.5 : modo === 'bike' ? 14 : 35;
  const stopMin = modo === 'car' ? 15 : 10;
  const travelMinutes = (totalMeters / 1000 / speedKmH) * 60;
  const totalMinutes = Math.round(travelMinutes + stops.length * stopMin);
  const durStr = totalMinutes < 60 ? `${totalMinutes} min` : `${Math.floor(totalMinutes/60)}h ${totalMinutes % 60}m`;
  const distStr = totalMeters < 1000 ? `${Math.round(totalMeters)} m` : `${(totalMeters/1000).toFixed(1)} km`;
  
  const customId = 'custom_' + Date.now();
  window._CUSTOM_ITIN = {
    id: customId,
    nombre: `Circuito a medida (${loc || 'Partido de Giles'})`,
    loc: loc || 'Partido de SAG',
    modo: modo === 'walk' ? 'A pie' : modo === 'bike' ? 'En bicicleta' : 'En vehículo',
    dist: distStr,
    duracion: durStr,
    bienes: stops.map(s => s.id)
  };
  
  const resEl = $('#genResult');
  resEl.hidden = false;
  resEl.innerHTML = `
    <div class="gen-result-header">
      <div>
        <h3>Itinerario generado: ${stops.length} paradas seleccionadas</h3>
        <p class="muted" style="margin:0">Distancia aproximada: <b>${distStr}</b> · Duración sugerida: <b>${durStr}</b> (${esc(window._CUSTOM_ITIN.modo)})</p>
      </div>
      <a class="btn primary" href="#/mapa?itinerario=${customId}">Cargar en el mapa interactivo</a>
    </div>
    <div class="gen-stops-grid">
      ${stops.map((s, idx) => `
        <div class="stop-item">
          <span class="idx">${idx + 1}</span>
          <div class="info">
            <b>${esc(s.n)}</b>
            <small>${esc(s.locRaw || s.loc)} · ${esc(s.norma)} · ${CATS[catOf(s)].n}</small>
          </div>
          <a class="btn small" href="#/ficha/${s.id}">Ver ficha</a>
        </div>
      `).join('')}
    </div>
  `;
}

function loadItineraryOnMap(itinId) {
  let circuit = CIRCUITOS.find(c => c.id === itinId);
  if (!circuit && window._CUSTOM_ITIN && window._CUSTOM_ITIN.id === itinId) {
    circuit = window._CUSTOM_ITIN;
  }
  if (!circuit) return;
  ACTIVE_ITIN = circuit;
  ITIN_STEP_IDX = 0;
  
  if (!MAP) initMap();
  if (ITIN_LAYER && MAP) MAP.removeLayer(ITIN_LAYER);
  ITIN_LAYER = L.layerGroup().addTo(MAP);
  
  const stops = [];
  circuit.bienes.forEach((bid, idx) => {
    const b = BY[bid];
    if (!b || !located(b)) return;
    const p = ptOf(b);
    if (!p) return;
    stops.push({ bien: b, pt: p, idx: idx + 1 });
  });
  
  if (!stops.length) {
    alert('No se encontraron sitios localizados para este itinerario.');
    return;
  }
  
  const latlngs = stops.map(s => s.pt);
  L.polyline(latlngs, {
    color: '#233b2f',
    weight: 4,
    opacity: 0.85,
    dashArray: '8 6'
  }).addTo(ITIN_LAYER);
  
  stops.forEach(s => {
    const icon = L.divIcon({
      className: 'itin-marker-badge',
      html: `<span>${s.idx}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const m = L.marker(s.pt, { icon }).addTo(ITIN_LAYER);
    m.bindPopup(() => popupBien(s.bien));
    s.marker = m;
  });
  
  MAP.fitBounds(L.latLngBounds(latlngs).pad(0.25));
  
  const banner = $('#itineraryBanner');
  if (banner) {
    banner.hidden = false; banner.style.display = 'flex';
    banner.innerHTML = `<span><b>Itinerario:</b> ${esc(circuit.nombre)} · <span id="itStepText">Parada 1 de ${stops.length}: ${esc(stops[0].bien.n)}</span></span>
      <div class="it-controls">
        <button class="btn small" id="itPrevBtn">‹ Anterior</button>
        <button class="btn small" id="itNextBtn">Siguiente ›</button>
        <button class="btn small" id="itCloseBtn" title="Cerrar itinerario">✕</button>
      </div>`;
    $('#itPrevBtn').onclick = () => stepItinerary(-1, stops);
    $('#itNextBtn').onclick = () => stepItinerary(1, stops);
    $('#itCloseBtn').onclick = closeItinerary;
  }
  
  setTimeout(() => {
    MAP.flyTo(stops[0].pt, 17, { duration: 0.7 });
    setTimeout(() => stops[0].marker.openPopup(), 800);
  }, 300);
}

function stepItinerary(delta, stops) {
  if (!stops || !stops.length) return;
  ITIN_STEP_IDX = (ITIN_STEP_IDX + delta + stops.length) % stops.length;
  const cur = stops[ITIN_STEP_IDX];
  const txt = $('#itStepText');
  if (txt) txt.textContent = `Parada ${cur.idx} de ${stops.length}: ${cur.bien.n}`;
  MAP.flyTo(cur.pt, 17, { duration: 0.7 });
  setTimeout(() => cur.marker.openPopup(), 800);
}

function closeItinerary() {
  if (ITIN_LAYER && MAP) {
    MAP.removeLayer(ITIN_LAYER);
    ITIN_LAYER = null;
  }
  ACTIVE_ITIN = null;
  const banner = $('#itineraryBanner');
  if (banner) {
    banner.hidden = true;
    banner.style.display = 'none';
    banner.innerHTML = '';
  }
  // Limpiar el parámetro itinerario de la URL para que no vuelva a dispararse
  if (location.hash.includes('itinerario')) {
    history.replaceState(null, '', '#/mapa');
  }
  if (MAP) {
    MAP.setView([-34.445, -59.447], 14);
  }
  showToast('Itinerario cerrado');
}

/* ------------ calendario ------------ */
function renderCalendario() {
  const mesSel = $('#calMes');
  const tipoSel = $('#calTipo');
  const locSel = $('#calLoc');
  
  const updateList = () => {
    const mes = mesSel?.value || '';
    const tipo = tipoSel?.value || '';
    const loc = locSel?.value || '';
    
    const list = CELEBRACIONES.filter(c => {
      return (!mes || c.mes === +mes) && (!tipo || c.tipo === tipo) && (!loc || c.loc.includes(loc));
    }).sort((a, b) => a.mes - b.mes);
    
    const calList = $('#calList');
    if (!calList) return;
    
    if (!list.length) {
      calList.innerHTML = '<p class="muted">No se encontraron celebraciones para los filtros seleccionados.</p>';
      return;
    }
    
    const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    calList.innerHTML = list.map(c => {
      const bienesLinks = (c.bienesIds || []).map(bid => {
        const b = BY[bid];
        return b ? `<a href="#/ficha/${b.id}" title="Ver ficha del bien">${esc(b.n)}</a>` : '';
      }).filter(Boolean).join(', ');
      
      const tipoColor = c.tipo === 'Patrimonio inmaterial' ? 'var(--c4)' : c.tipo === 'Fiesta popular' ? 'var(--c1)' : c.tipo === 'Fiesta patronal' ? 'var(--c2)' : 'var(--c3)';
      
      return `<article class="cal-card">
        <div class="cal-head">
          <div class="cal-date-badge">
            <div class="mon">${MESES[c.mes]}</div>
            <div class="day">${esc(c.fecha.replace(/\D/g, '') || '—')}</div>
          </div>
          <div class="cal-title-wrap">
            <span class="pill" style="background:${tipoColor};color:#fff;font-size:.7rem;margin-bottom:4px;display:inline-block">${esc(c.tipo)}</span>
            <h3>${esc(c.nombre)}</h3>
            <div class="sub">📍 ${esc(c.loc)} · ${esc(c.fecha)}</div>
          </div>
        </div>
        <p class="cal-desc">${esc(c.desc)}</p>
        ${bienesLinks ? `<div class="cal-bienes-wrap"><b>Bienes vinculados:</b> ${bienesLinks}</div>` : ''}
        <div class="cal-foot">
          <small class="muted">Sede: ${esc(c.sede)}</small>
          <button class="btn small" data-calid="${c.id}">📅 Guardar (.ics)</button>
        </div>
      </article>`;
    }).join('');
    
    $$('#calList button[data-calid]').forEach(btn => {
      btn.onclick = () => {
        const ev = CELEBRACIONES.find(c => c.id === btn.dataset.calid);
        if (ev) downloadICS(ev);
      };
    });
  };
  
  [mesSel, tipoSel, locSel].forEach(sel => {
    if (sel && !sel._calBound) {
      sel._calBound = true;
      sel.addEventListener('change', updateList);
    }
  });
  
  const allIcsBtn = $('#exportAllIcs');
  if (allIcsBtn && !allIcsBtn._bound) {
    allIcsBtn._bound = true;
    allIcsBtn.onclick = downloadAllICS;
  }
  
  updateList();
}

function downloadICS(ev) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const year = new Date().getFullYear();
  const m = String(ev.mes).padStart(2, '0');
  const d = String(parseInt(ev.fecha.replace(/\D/g, '')) || 1).padStart(2, '0');
  const dt = `${year}${m}${d}`;
  
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PCSAG//Patrimonio Cultural San Andres de Giles//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${ev.id}-${year}@patrimoniosag.gob.ar
DTSTAMP:${now}
DTSTART;VALUE=DATE:${dt}
DTEND;VALUE=DATE:${dt}
SUMMARY:${ev.nombre}
DESCRIPTION:${ev.desc.replace(/\n/g, '\\n')}
LOCATION:${ev.sede}, ${ev.loc}, Buenos Aires, Argentina
CATEGORIES:${ev.tipo}
URL:https://surtectura.github.io/patrimonio-sag/#/calendario
END:VEVENT
END:VCALENDAR`;

  downloadBlob(ics, `${ev.id}_sag.ics`, 'text/calendar;charset=utf-8');
  showToast('Evento guardado en archivo .ics');
}

function downloadAllICS() {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const year = new Date().getFullYear();
  
  const vevents = CELEBRACIONES.map(ev => {
    const m = String(ev.mes).padStart(2, '0');
    const d = String(parseInt(ev.fecha.replace(/\D/g, '')) || 1).padStart(2, '0');
    const dt = `${year}${m}${d}`;
    return `BEGIN:VEVENT
UID:${ev.id}-${year}@patrimoniosag.gob.ar
DTSTAMP:${now}
DTSTART;VALUE=DATE:${dt}
DTEND;VALUE=DATE:${dt}
SUMMARY:${ev.nombre}
DESCRIPTION:${ev.desc.replace(/\n/g, '\\n')}
LOCATION:${ev.sede}, ${ev.loc}, Buenos Aires, Argentina
CATEGORIES:${ev.tipo}
END:VEVENT`;
  }).join('\n');

  const fullIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PCSAG//Patrimonio Cultural San Andres de Giles//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Patrimonio Cultural y Fiestas de Giles
X-WR-TIMEZONE:America/Argentina/Buenos_Aires
${vevents}
END:VCALENDAR`;

  downloadBlob(fullIcs, `agenda_patrimonial_giles_${year}.ics`, 'text/calendar;charset=utf-8');
  showToast('Calendario anual completo descargado');
}


/* ------------ toast notification ------------ */
function showToast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ------------ distance & gps ------------ */
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestBien(lat, lng) {
  let best = null, bestDist = Infinity;
  BIENES.filter(located).forEach(b => {
    const p = ptOf(b);
    if (!p) return;
    const d = calcDistance(lat, lng, p[0], p[1]);
    if (d < bestDist) { bestDist = d; best = b; }
  });
  return { bien: best, dist: bestDist };
}

function toggleGPS() {
  const btn = $('#gpsBtn');
  const bar = $('#gpsBar');
  if (GPS_WATCH_ID !== null) {
    navigator.geolocation.clearWatch(GPS_WATCH_ID);
    GPS_WATCH_ID = null;
    if (GPS_LAYER && MAP) { MAP.removeLayer(GPS_LAYER); GPS_LAYER = null; }
    btn?.classList.remove('active');
    if (bar) bar.hidden = true;
    showToast('GPS desactivado');
    return;
  }
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización.');
    return;
  }
  btn?.classList.add('active');
  if (bar) {
    bar.hidden = false;
    bar.innerHTML = `<span><b>Buscando señal GPS…</b> Activá la ubicación en tu dispositivo.</span> <button class="btn small" id="gpsCloseBtn">✕</button>`;
    $('#gpsCloseBtn').onclick = toggleGPS;
  }
  showToast('Conectando GPS...');
  let firstFix = true;
  GPS_WATCH_ID = navigator.geolocation.watchPosition(
    pos => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      USER_POS = [lat, lng];
      if (!GPS_LAYER && MAP) GPS_LAYER = L.layerGroup().addTo(MAP);
      if (GPS_LAYER) GPS_LAYER.clearLayers();
      const pulseIcon = L.divIcon({ className: 'gps-user-marker', iconSize: [18, 18], iconAnchor: [9, 9] });
      L.marker([lat, lng], { icon: pulseIcon }).addTo(GPS_LAYER);
      L.circle([lat, lng], { radius: accuracy, color: '#2563eb', weight: 1, fillColor: '#2563eb', fillOpacity: 0.12 }).addTo(GPS_LAYER);
      if (firstFix && MAP) {
        MAP.setView([lat, lng], 16);
        firstFix = false;
      }
      const nearest = findNearestBien(lat, lng);
      if (bar && nearest && nearest.bien) {
        const dText = nearest.dist < 1000 ? Math.round(nearest.dist) + ' m' : (nearest.dist / 1000).toFixed(1) + ' km';
        bar.innerHTML = `<span><b>Tu ubicación</b> (±${Math.round(accuracy)}m) · Sitio más cercano: <b>${esc(nearest.bien.n)}</b> a ${dText}</span>
          <a class="btn small primary" href="#/ficha/${nearest.bien.id}">Ver ficha</a>
          <button class="btn small" id="gpsCenterBtn" title="Centrar mapa">📍</button>
          <button class="btn small" id="gpsCloseBtn">✕</button>`;
        $('#gpsCloseBtn').onclick = toggleGPS;
        $('#gpsCenterBtn').onclick = () => MAP && MAP.panTo([lat, lng]);
      }
    },
    err => {
      console.warn('GPS error:', err);
      if (bar) bar.innerHTML = `<span><b>Error de ubicación:</b> ${esc(err.message || 'No se pudo obtener la señal')}</span> <button class="btn small" id="gpsCloseBtn">✕</button>`;
      $('#gpsCloseBtn').onclick = toggleGPS;
      btn?.classList.remove('active');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  );
}

/* ------------ measure tool ------------ */
function toggleMeasure() {
  const btn = $('#measureBtn');
  const bar = $('#measureBar');
  MEASURING = !MEASURING;
  if (!MEASURING) {
    clearMeasure();
    btn?.classList.remove('active');
    if (bar) bar.hidden = true;
    if (MAP) MAP.getContainer().style.cursor = '';
    return;
  }
  btn?.classList.add('active');
  if (bar) {
    bar.hidden = false;
    bar.innerHTML = `<span><b>Regla de medición:</b> Clic en el mapa para marcar vértices. Distancia total: <b id="measTotal">0 m</b></span> <button class="btn small" id="measClear">Limpiar</button> <button class="btn small" id="measClose">✕</button>`;
    $('#measClear').onclick = clearMeasure;
    $('#measClose').onclick = toggleMeasure;
  }
  if (MAP) MAP.getContainer().style.cursor = 'crosshair';
  showToast('Modo regla activo: clic en el mapa');
}

function clearMeasure() {
  MEASURE_POINTS = [];
  if (MEASURE_LAYER && MAP) { MAP.removeLayer(MEASURE_LAYER); MEASURE_LAYER = null; }
  const mt = $('#measTotal'); if (mt) mt.textContent = '0 m';
}

function onMeasureClick(e) {
  MEASURE_POINTS.push(e.latlng);
  if (!MEASURE_LAYER && MAP) MEASURE_LAYER = L.layerGroup().addTo(MAP);
  if (MEASURE_LAYER) MEASURE_LAYER.clearLayers();
  
  MEASURE_POINTS.forEach(pt => {
    L.circleMarker(pt, { radius: 5, color: '#e9c46a', fillColor: '#b4532e', fillOpacity: 1, weight: 2 }).addTo(MEASURE_LAYER);
  });
  if (MEASURE_POINTS.length > 1) {
    L.polyline(MEASURE_POINTS, { color: '#e9c46a', weight: 3, dashArray: '6 4' }).addTo(MEASURE_LAYER);
  }
  
  let dist = 0;
  for (let i = 0; i < MEASURE_POINTS.length - 1; i++) {
    dist += calcDistance(MEASURE_POINTS[i].lat, MEASURE_POINTS[i].lng, MEASURE_POINTS[i+1].lat, MEASURE_POINTS[i+1].lng);
  }
  const dStr = dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(2) + ' km';
  const mt = $('#measTotal'); if (mt) mt.textContent = dStr;
}

/* ------------ export data ------------ */
function showExportMenu() {
  const currentList = BIENES.filter(b => inFilter(b) && matchText(b, $('#mapSearch')?.value || ''));
  const choice = confirm(`¿Deseás descargar los ${currentList.length} bienes patrimoniales actualmente filtrados?\n\n- Aceptar: Descargar GeoJSON (para QGIS/ArcGIS)\n- Cancelar: Descargar KML (para Google Earth)`);
  if (choice) {
    exportGeoJSON(currentList);
  } else {
    exportKML(currentList);
  }
}

function exportGeoJSON(list) {
  const feats = [];
  list.filter(located).forEach(b => {
    const G = geomOf(b);
    if (!G || !G.g) return;
    G.g.forEach(geom => {
      feats.push({
        type: 'Feature',
        geometry: geom,
        properties: {
          id: b.id,
          nombre: b.n,
          localidad: b.locRaw || b.loc,
          ubicacion: b.ubi,
          catastro: b.cat,
          norma: b.norma,
          anio: b.anio,
          tipo: b.tipo,
          categoria: b.catTxt,
          estado: b.estado,
          fundamento: b.fund
        }
      });
    });
  });
  const data = JSON.stringify({ type: 'FeatureCollection', features: feats }, null, 2);
  downloadBlob(data, 'patrimonio_cultural_sag.geojson', 'application/geo+json');
  showToast('GeoJSON descargado con éxito');
}

function exportKML(list) {
  let placemarks = '';
  list.filter(located).forEach(b => {
    const p = ptOf(b);
    if (!p) return;
    placemarks += `  <Placemark>
    <name>${esc(b.n)}</name>
    <description><![CDATA[<b>${esc(b.norma)} (${esc(b.anio)})</b><br>${esc(b.loc)} · ${esc(b.tipo)}<br><p>${esc(b.res || b.fund || '')}</p>]]></description>
    <Point>
      <coordinates>${p[1]},${p[0]},0</coordinates>
    </Point>
  </Placemark>\n`;
  });
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Patrimonio Cultural - San Andres de Giles</name>
    <description>Bienes declarados del Partido de San Andres de Giles (Ord. 2182/19)</description>
${placemarks}  </Document>
</kml>`;
  downloadBlob(kml, 'patrimonio_cultural_sag.kml', 'application/vnd.google-earth.kml+xml');
  showToast('KML descargado con éxito');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

/* ------------ share ficha ------------ */
function shareFicha(b) {
  const url = `${window.location.origin}${window.location.pathname}#/ficha/${b.id}`;
  if (navigator.share) {
    navigator.share({
      title: `${b.n} · Patrimonio Cultural SAG`,
      text: `Conocé la ficha de ${b.n} (${b.norma}) en el Registro Oficial del Patrimonio de San Andrés de Giles.`,
      url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Enlace copiado al portapapeles');
    }).catch(() => {
      prompt('Copiá el enlace a esta ficha:', url);
    });
  }
}

/* ------------ itinerarios con modos (Peatonal, Bici, Moto, Auto) ------------ */
function circuitStats(c, modeKey) {
  const modo = MODOS[modeKey] || MODOS.walk;
  const stops = c.bienes.map(id => BY[id]).filter(b => b && located(b));
  let totalMeters = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const p1 = ptOf(stops[i]), p2 = ptOf(stops[i+1]);
    if (p1 && p2) totalMeters += calcDistance(p1[0], p1[1], p2[0], p2[1]);
  }
  const travelMinutes = (totalMeters / 1000 / modo.vel) * 60;
  const totalMinutes = Math.round(travelMinutes + stops.length * modo.stopMin);
  const durStr = totalMinutes < 60 ? `${totalMinutes} min` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  const distStr = totalMeters < 1000 ? `${Math.round(totalMeters)} m` : `${(totalMeters / 1000).toFixed(1)} km`;
  return { distStr, durStr, totalMeters, totalMinutes, stopsCount: stops.length };
}

async function fetchRouteGeometry(coords, modeKey) {
  if (coords.length < 2) return null;
  const modo = MODOS[modeKey] || MODOS.walk;
  const profile = modo.profile;
  const coordStr = coords.map(c => `${c[1].toFixed(6)},${c[0].toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordStr}?overview=full&geometries=geojson`;
  
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('Status ' + res.status);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const r = data.routes[0];
      const latlngs = r.geometry.coordinates.map(c => [c[1], c[0]]);
      return {
        latlngs,
        distanceMeters: r.distance,
        durationSeconds: r.duration
      };
    }
  } catch (err) {
    console.warn('OSRM routing unavailable, using direct segments fallback:', err);
  }
  
  let dist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    dist += calcDistance(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]);
  }
  const durSec = (dist / 1000 / modo.vel) * 3600;
  return {
    latlngs: coords,
    distanceMeters: dist,
    durationSeconds: durSec
  };
}

async function loadItineraryOnMap(itinId, chosenMode) {
  let circuit = CIRCUITOS.find(c => c.id === itinId);
  if (!circuit && window._CUSTOM_ITIN && window._CUSTOM_ITIN.id === itinId) {
    circuit = window._CUSTOM_ITIN;
  }
  if (!circuit) return;
  
  ACTIVE_ITIN = circuit;
  const modeKey = chosenMode || circuit.defaultModo || 'walk';
  ACTIVE_ITIN.currentMode = modeKey;
  const modo = MODOS[modeKey] || MODOS.walk;
  
  if (!MAP) initMap();
  if (ITIN_LAYER && MAP) MAP.removeLayer(ITIN_LAYER);
  ITIN_LAYER = L.layerGroup().addTo(MAP);
  
  const stops = [];
  circuit.bienes.forEach((bid, idx) => {
    const b = BY[bid];
    if (!b || !located(b)) return;
    const p = ptOf(b);
    if (!p) return;
    stops.push({ bien: b, pt: p, idx: idx + 1 });
  });
  
  if (!stops.length) {
    alert('No se encontraron sitios con coordenadas válidas para este circuito.');
    return;
  }
  
  const waypoints = stops.map(s => s.pt);
  
  const banner = $('#itineraryBanner');
  if (banner) {
    banner.hidden = false; banner.style.display = 'flex';
    banner.innerHTML = `<span><b>Trazando ruta ${esc(modo.n)}…</b> ${esc(circuit.nombre)}</span>`;
  }
  
  const routeData = await fetchRouteGeometry(waypoints, modeKey);
  const routeLatLngs = routeData.latlngs;
  
  // Línea de contraste blanco (casing)
  L.polyline(routeLatLngs, {
    color: '#ffffff',
    weight: 7,
    opacity: 0.9,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(ITIN_LAYER);
  
  // Línea principal de ruta coloreada según el modo
  L.polyline(routeLatLngs, {
    color: modo.color,
    weight: modo.weight,
    opacity: 0.95,
    dashArray: modo.dash,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(ITIN_LAYER);
  
  // Marcadores de parada con insignia numerada
  stops.forEach(s => {
    const icon = L.divIcon({
      className: 'itin-marker-badge',
      html: `<span>${s.idx}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const m = L.marker(s.pt, { icon }).addTo(ITIN_LAYER);
    m.bindPopup(() => popupBien(s.bien));
    s.marker = m;
  });
  
  MAP.fitBounds(L.latLngBounds(routeLatLngs).pad(0.18));
  
  const totalMeters = routeData.distanceMeters;
  const distStr = totalMeters < 1000 ? `${Math.round(totalMeters)} m` : `${(totalMeters / 1000).toFixed(1)} km`;
  const totalMinutes = Math.round((routeData.durationSeconds / 60) + stops.length * modo.stopMin);
  const durStr = totalMinutes < 60 ? `${totalMinutes} min` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  
  if (banner) {
    banner.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;width:100%">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <b>${esc(circuit.nombre)}</b> · <span id="itStepText">Parada 1 de ${stops.length}: ${esc(stops[0].bien.n)}</span>
            <small class="muted" style="margin-left:6px">(${distStr} · ~${durStr})</small>
          </div>
          <div class="itin-mode-bar">
            ${['walk', 'bike', 'moto', 'car'].map(mKey => `
              <button class="itin-mode-btn ${mKey === modeKey ? 'on' : ''}" data-m="${mKey}">
                ${MODOS[mKey].icon} ${MODOS[mKey].n}
              </button>
            `).join('')}
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div class="it-controls">
            <button class="btn small" id="itPrevBtn">‹ Anterior</button>
            <button class="btn small" id="itNextBtn">Siguiente ›</button>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn small" id="itGmapsBtn" title="Abrir recorrido en Google Maps">🗺️ En Google Maps</button>
            <button class="btn small" id="itCloseBtn" title="Cerrar itinerario">✕ Salir</button>
          </div>
        </div>
      </div>
    `;
    
    $$('#itineraryBanner .itin-mode-btn').forEach(btn => {
      btn.onclick = () => {
        loadItineraryOnMap(itinId, btn.dataset.m);
      };
    });
    
    $('#itPrevBtn').onclick = () => stepItinerary(-1, stops);
    $('#itNextBtn').onclick = () => stepItinerary(1, stops);
    $('#itCloseBtn').onclick = closeItinerary;
    
    $('#itGmapsBtn').onclick = () => {
      const gMode = modeKey === 'walk' ? 'walking' : modeKey === 'bike' ? 'bicycling' : modeKey === 'moto' ? 'two_wheeler' : 'driving';
      const origin = `${stops[0].pt[0]},${stops[0].pt[1]}`;
      const dest = `${stops[stops.length-1].pt[0]},${stops[stops.length-1].pt[1]}`;
      const waypts = stops.slice(1, -1).map(s => `${s.pt[0]},${s.pt[1]}`).join('|');
      const gUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypts ? '&waypoints=' + encodeURIComponent(waypts) : ''}&travelmode=${gMode}`;
      window.open(gUrl, '_blank', 'noopener');
    };
  }
  
  ITIN_STEP_IDX = 0;
}

function stepItinerary(delta, stops) {
  if (!stops || !stops.length) return;
  ITIN_STEP_IDX = (ITIN_STEP_IDX + delta + stops.length) % stops.length;
  const cur = stops[ITIN_STEP_IDX];
  const txt = $('#itStepText');
  if (txt) txt.textContent = `Parada ${cur.idx} de ${stops.length}: ${cur.bien.n}`;
  MAP.flyTo(cur.pt, 17, { duration: 0.7 });
  setTimeout(() => cur.marker.openPopup(), 800);
}

function closeItinerary() {
  if (ITIN_LAYER && MAP) { MAP.removeLayer(ITIN_LAYER); ITIN_LAYER = null; }
  ACTIVE_ITIN = null;
  const banner = $('#itineraryBanner');
  if (banner) banner.hidden = true;
}

function renderItinerarios() {
  $$('.itin-tab-btn').forEach(btn => {
    btn.onclick = () => {
      $$('.itin-tab-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      $$('.itin-tab-content').forEach(c => c.classList.remove('on'));
      const target = $('#itab-' + btn.dataset.itab);
      if (target) target.classList.add('on');
    };
  });
  
  const curList = $('#curatedList');
  if (curList) {
    curList.innerHTML = CIRCUITOS.map(c => {
      const stopsHtml = c.bienes.slice(0, 4).map((bid, i) => {
        const b = BY[bid];
        return b ? `<li><span class="step-n">${i+1}</span> <span>${esc(b.n)}</span></li>` : '';
      }).join('');
      const moreCount = c.bienes.length > 4 ? `<li><small class="muted">+ ${c.bienes.length - 4} paradas más…</small></li>` : '';
      
      const modeButtons = ['walk', 'bike', 'moto', 'car'].map(mKey => {
        const st = circuitStats(c, mKey);
        const isDef = mKey === c.defaultModo;
        return `<a class="btn small ${isDef ? 'primary' : ''}" href="#/mapa?itinerario=${c.id}&modo=${mKey}" title="Recorrer en modo ${MODOS[mKey].n}">
          ${MODOS[mKey].icon} ${MODOS[mKey].n} (${st.durStr})
        </a>`;
      }).join(' ');
      
      const defStats = circuitStats(c, c.defaultModo || 'walk');
      
      return `<article class="itin-card">
        <div class="itin-card-head">
          <div class="itin-badge-strip">
            <span class="itin-badge accent">${MODOS[c.defaultModo || 'walk'].icon} Sugerido: ${MODOS[c.defaultModo || 'walk'].n}</span>
            <span class="itin-badge">${defStats.distStr}</span>
            <span class="itin-badge">${c.bienes.length} paradas</span>
          </div>
          <h3>${esc(c.nombre)}</h3>
          <small class="muted">${esc(c.loc)}</small>
        </div>
        <div class="itin-card-body">
          <p>${esc(c.desc)}</p>
          <div class="itin-stops-preview">
            <b>Principales paradas:</b>
            <ul class="itin-stops-list">${stopsHtml}${moreCount}</ul>
          </div>
        </div>
        <div class="itin-card-foot" style="flex-direction:column;align-items:stretch;gap:8px">
          <small class="muted">Elegí el medio para abrir la ruta en el mapa:</small>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${modeButtons}
          </div>
        </div>
      </article>`;
    }).join('');
  }
  
  const genBtn = $('#genBtn');
  if (genBtn && !genBtn._bound) {
    genBtn._bound = true;
    genBtn.onclick = generateCustomItinerary;
  }
}

function generateCustomItinerary() {
  const loc = $('#genLoc').value;
  const modoKey = $('#genModo').value || 'walk';
  const cat = $('#genCat').value;
  const max = +$('#genCount').value || 8;
  const modo = MODOS[modoKey] || MODOS.walk;
  
  let candidates = BIENES.filter(b => located(b) && (!loc || b.loc === loc) && (!cat || b.cats.includes(cat)));
  if (!candidates.length) {
    alert('No se encontraron sitios patrimoniales con esos criterios. Probá ampliando la localidad o categorías.');
    return;
  }
  
  const stops = [];
  let remaining = candidates.slice();
  let current = remaining.shift();
  stops.push(current);
  
  while (remaining.length && stops.length < max) {
    const p1 = ptOf(current);
    let bestIdx = 0, bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const p2 = ptOf(remaining[i]);
      const d = calcDistance(p1[0], p1[1], p2[0], p2[1]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    current = remaining.splice(bestIdx, 1)[0];
    stops.push(current);
  }
  
  let totalMeters = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const p1 = ptOf(stops[i]), p2 = ptOf(stops[i+1]);
    totalMeters += calcDistance(p1[0], p1[1], p2[0], p2[1]);
  }
  
  const travelMinutes = (totalMeters / 1000 / modo.vel) * 60;
  const totalMinutes = Math.round(travelMinutes + stops.length * modo.stopMin);
  const durStr = totalMinutes < 60 ? `${totalMinutes} min` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  const distStr = totalMeters < 1000 ? `${Math.round(totalMeters)} m` : `${(totalMeters / 1000).toFixed(1)} km`;
  
  const customId = 'custom_' + Date.now();
  window._CUSTOM_ITIN = {
    id: customId,
    nombre: `Circuito a medida (${loc || 'Partido de Giles'})`,
    loc: loc || 'Partido de SAG',
    defaultModo: modoKey,
    bienes: stops.map(s => s.id)
  };
  
  const resEl = $('#genResult');
  resEl.hidden = false;
  resEl.innerHTML = `
    <div class="gen-result-header">
      <div>
        <h3>Itinerario generado: ${stops.length} paradas seleccionadas</h3>
        <p class="muted" style="margin:0">Distancia aproximada: <b>${distStr}</b> · Duración estimada: <b>${durStr}</b> (${modo.icon} ${modo.n})</p>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${['walk', 'bike', 'moto', 'car'].map(mKey => `
          <a class="btn small ${mKey === modoKey ? 'primary' : ''}" href="#/mapa?itinerario=${customId}&modo=${mKey}">
            ${MODOS[mKey].icon} Trazar ${MODOS[mKey].n}
          </a>
        `).join('')}
      </div>
    </div>
    <div class="gen-stops-grid">
      ${stops.map((s, idx) => `
        <div class="stop-item">
          <span class="idx">${idx + 1}</span>
          <div class="info">
            <b>${esc(s.n)}</b>
            <small>${esc(s.locRaw || s.loc)} · ${esc(s.norma)} · ${CATS[catOf(s)].n}</small>
          </div>
          <a class="btn small" href="#/ficha/${s.id}">Ver ficha</a>
        </div>
      `).join('')}
    </div>
  `;
}

/* ------------ calendario ------------ */
function renderCalendario() {
  const mesSel = $('#calMes');
  const tipoSel = $('#calTipo');
  const locSel = $('#calLoc');
  
  const updateList = () => {
    const mes = mesSel?.value || '';
    const tipo = tipoSel?.value || '';
    const loc = locSel?.value || '';
    
    const list = CELEBRACIONES.filter(c => {
      return (!mes || c.mes === +mes) && (!tipo || c.tipo === tipo) && (!loc || c.loc.includes(loc));
    }).sort((a, b) => a.mes - b.mes);
    
    const calList = $('#calList');
    if (!calList) return;
    
    if (!list.length) {
      calList.innerHTML = '<p class="muted">No se encontraron celebraciones para los filtros seleccionados.</p>';
      return;
    }
    
    const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    calList.innerHTML = list.map(c => {
      const bienesLinks = (c.bienesIds || []).map(bid => {
        const b = BY[bid];
        return b ? `<a href="#/ficha/${b.id}" title="Ver ficha del bien">${esc(b.n)}</a>` : '';
      }).filter(Boolean).join(', ');
      
      const tipoColor = c.tipo === 'Patrimonio inmaterial' ? 'var(--c4)' : c.tipo === 'Fiesta popular' ? 'var(--c1)' : c.tipo === 'Fiesta patronal' ? 'var(--c2)' : 'var(--c3)';
      
      return `<article class="cal-card">
        <div class="cal-head">
          <div class="cal-date-badge">
            <div class="mon">${MESES[c.mes]}</div>
            <div class="day">${esc(c.fecha.replace(/\D/g, '') || '—')}</div>
          </div>
          <div class="cal-title-wrap">
            <span class="pill" style="background:${tipoColor};color:#fff;font-size:.7rem;margin-bottom:4px;display:inline-block">${esc(c.tipo)}</span>
            <h3>${esc(c.nombre)}</h3>
            <div class="sub">📍 ${esc(c.loc)} · ${esc(c.fecha)}</div>
          </div>
        </div>
        <p class="cal-desc">${esc(c.desc)}</p>
        ${bienesLinks ? `<div class="cal-bienes-wrap"><b>Bienes vinculados:</b> ${bienesLinks}</div>` : ''}
        <div class="cal-foot">
          <small class="muted">Sede: ${esc(c.sede)}</small>
          <button class="btn small" data-calid="${c.id}">📅 Guardar (.ics)</button>
        </div>
      </article>`;
    }).join('');
    
    $$('#calList button[data-calid]').forEach(btn => {
      btn.onclick = () => {
        const ev = CELEBRACIONES.find(c => c.id === btn.dataset.calid);
        if (ev) downloadICS(ev);
      };
    });
  };
  
  [mesSel, tipoSel, locSel].forEach(sel => {
    if (sel && !sel._calBound) {
      sel._calBound = true;
      sel.addEventListener('change', updateList);
    }
  });
  
  const allIcsBtn = $('#exportAllIcs');
  if (allIcsBtn && !allIcsBtn._bound) {
    allIcsBtn._bound = true;
    allIcsBtn.onclick = downloadAllICS;
  }
  
  updateList();
}

function downloadICS(ev) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const year = new Date().getFullYear();
  const m = String(ev.mes).padStart(2, '0');
  const d = String(parseInt(ev.fecha.replace(/\D/g, '')) || 1).padStart(2, '0');
  const dt = `${year}${m}${d}`;
  
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PCSAG//Patrimonio Cultural San Andres de Giles//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${ev.id}-${year}@patrimoniosag.gob.ar
DTSTAMP:${now}
DTSTART;VALUE=DATE:${dt}
DTEND;VALUE=DATE:${dt}
SUMMARY:${ev.nombre}
DESCRIPTION:${ev.desc.replace(/\n/g, '\\n')}
LOCATION:${ev.sede}, ${ev.loc}, Buenos Aires, Argentina
CATEGORIES:${ev.tipo}
URL:https://surtectura.github.io/patrimonio-sag/#/calendario
END:VEVENT
END:VCALENDAR`;

  downloadBlob(ics, `${ev.id}_sag.ics`, 'text/calendar;charset=utf-8');
  showToast('Evento guardado en archivo .ics');
}

function downloadAllICS() {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const year = new Date().getFullYear();
  
  const vevents = CELEBRACIONES.map(ev => {
    const m = String(ev.mes).padStart(2, '0');
    const d = String(parseInt(ev.fecha.replace(/\D/g, '')) || 1).padStart(2, '0');
    const dt = `${year}${m}${d}`;
    return `BEGIN:VEVENT
UID:${ev.id}-${year}@patrimoniosag.gob.ar
DTSTAMP:${now}
DTSTART;VALUE=DATE:${dt}
DTEND;VALUE=DATE:${dt}
SUMMARY:${ev.nombre}
DESCRIPTION:${ev.desc.replace(/\n/g, '\\n')}
LOCATION:${ev.sede}, ${ev.loc}, Buenos Aires, Argentina
CATEGORIES:${ev.tipo}
END:VEVENT`;
  }).join('\n');

  const fullIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PCSAG//Patrimonio Cultural San Andres de Giles//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Patrimonio Cultural y Fiestas de Giles
X-WR-TIMEZONE:America/Argentina/Buenos_Aires
${vevents}
END:VCALENDAR`;

  downloadBlob(fullIcs, `agenda_patrimonial_giles_${year}.ics`, 'text/calendar;charset=utf-8');
  showToast('Calendario anual completo descargado');
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
  <h2>Georreferenciación y Localización</h2>
  <p>La totalidad de los bienes declarados de localización puntual (114 de 115 asientos) se encuentran georreferenciados sobre la imagen satelital y el parcelario oficial. El asiento restante (Arbolado público y espacios verdes) tiene alcance general sobre todo el territorio del Partido.</p>
  <table><tr><th>Estado</th><th>Criterio</th><th>Bienes</th></tr>
  <tr><td>${LST.kml}</td><td>Polígonos y puntos del KML «Lugares históricos declarados», vinculados a cada asiento por denominación y catastro.</td><td>${cnt('kml')}</td></tr>
  <tr><td>${LST.comision}</td><td>Puntos y parcelas verificados e incorporados al Registro Oficial por la Comisión de Patrimonio Cultural.</td><td>${cnt('comision')}</td></tr>
  <tr><td>${LST.parcela}</td><td>Nomenclatura catastral del texto de la ordenanza o de la documentación de la Comisión, cruzada con el parcelario ARBA/COU 2024.</td><td>${cnt('parcela') + cnt('coord')}</td></tr>
  <tr><td>${LST.planilla}</td><td>Nomenclatura tomada de la planilla 2024, sin respaldo en el texto normativo: se dibuja con borde punteado.</td><td>${cnt('planilla')}</td></tr>
  <tr><td>${LST.aprox}</td><td>Bienes muebles ubicados en su sede de resguardo, sepulcros en el Cementerio Norte, equipamientos parcialmente relevados.</td><td>${cnt('aprox')}</td></tr>
  <tr><td>${LST.tentativa}</td><td>Hipótesis a partir de las mensuras históricas del AHGBA (Posta de Rodríguez).</td><td>${cnt('tentativa')}</td></tr>
  <tr><td>${LST.general}</td><td>Bien de alcance general sobre todo el territorio del Partido (Arbolado público).</td><td>1</td></tr></table>
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

boot().catch(err => {
  console.error('Error al iniciar la aplicación:', err);
  const main = document.getElementById('main');
  if (main) {
    main.insertAdjacentHTML('afterbegin', `<div class="wrap"><div class="box warn"><b>No se pudieron cargar los datos.</b><br>Detalle: <code>${esc(err.message || String(err))}</code><br><br>Si estás en GitHub Pages, asegurate de que los cambios estén sincronizados y forzá la recarga con <code>Ctrl + F5</code> (o <code>Cmd + Shift + R</code>) para limpiar la caché del navegador.</div></div>`);
  }
});
})();
