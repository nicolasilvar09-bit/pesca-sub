// ================= núcleo: utilidades, estado global e configurações =================
const T = THREE;
// cores no espaço certo (sRGB -> linear) para usar curva de cor de cinema (ACES), estilo PUBG
T.ColorManagement.legacyMode = false;
const MAP = 1280, HALF = MAP / 2, CELL = 5, GN = MAP / CELL + 1; // ilha de ~1,1 km dentro de 1,28 km
const GRAV = 9.81;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const rr = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const wrapA = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
const $ = id => document.getElementById(id);
const fmtT = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function wpick(list) { // [[valor, peso], ...]
  let s = 0; for (const e of list) s += e[1];
  let r = Math.random() * s; for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; }
  return list[list.length - 1][0];
}
function mulberry(s) { return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeNoise(seed) {
  const r = mulberry(seed), P = new Float32Array(256 * 256);
  for (let i = 0; i < P.length; i++) P[i] = r() * 2 - 1;
  const at = (x, z) => P[((z & 255) << 8) | (x & 255)];
  function n(x, z) {
    const ix = Math.floor(x), iz = Math.floor(z), sx = smooth(x - ix), sz = smooth(z - iz);
    return lerp(lerp(at(ix, iz), at(ix + 1, iz), sx), lerp(at(ix, iz + 1), at(ix + 1, iz + 1), sx), sz);
  }
  function fbm(x, z, o) { let s = 0, a = 1, f = 1, t = 0; for (let i = 0; i < o; i++) { s += n(x * f, z * f) * a; t += a; a *= 0.5; f *= 2.03; } return s / t; }
  return { n, fbm };
}

// estado da partida
const G = {
  phase: 'lobby', // lobby | match | result
  t: 0, matchT: 0, actors: [], items: [], crates: [], player: null, view: null,
  mode: 'squad', size: 4, diff: 'mix', teams: {}, over: false, place: 0, feed: [],
};

// configurações e estatísticas do jogador (ficam no aparelho)
const SET_KEY = 'ilhazero_v1';
const SET = Object.assign({ name: 'Jogador', char: 0, sens: 1, adsSens: 0.8, quality: 1, fov: 90, view: 'tpp', vol: 0.8, mode: 'squad', diff: 'mix', matches: 0, wins: 0, kills: 0, best: 0, dmg: 0 },
  (() => { try { return JSON.parse(localStorage.getItem(SET_KEY) || '{}'); } catch (e) { return {}; } })());
function saveSet(cloud) { try { localStorage.setItem(SET_KEY, JSON.stringify(SET)); } catch (e) { } if (cloud !== false && typeof cloudPush === 'function') cloudPush(); }

let toastTm = 0;
function toast(msg, s = 2.2, cls = '') {
  const el = $('toast'); if (!el) return;
  el.textContent = msg; el.className = 'show ' + cls;
  clearTimeout(toastTm); toastTm = setTimeout(() => el.className = '', s * 1000);
}
