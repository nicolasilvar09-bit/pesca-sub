// ================= um modelo por espécie =================
// ajustes de corpo em cima do formato base (SHAPES). Campos novos do fishGeo:
// brow = testa alta e reta · snout = focinho mais longo · finlets = nº de pínulas · keel = quilha do pedúnculo
// tip/mid = recorte da cauda · fins = nadadeiras sob medida [início, fim, altura × dors, nós, embaixo?]
// (t vai de 0 na cauda a 1 no focinho; nos nós, 0 = fim de trás da nadadeira e 1 = frente)
const K_SICKLE = [[0, 0], [0.12, 0.22], [0.6, 0.3], [0.86, 1], [1, 0]];          // lobo em foice na frente (pampo)
const K_FILA = [[0, 0], [0.1, 0.12], [0.7, 0.18], [0.84, 0.35], [0.9, 1], [1, 0]]; // filamento comprido (peixe-galo)
const K_SOFT = [[0, 0], [0.15, 0.6], [0.7, 1], [0.95, 0.85], [1, 0]];
const K_SPINY = [[0, 0], [0.12, 0.55], [0.4, 0.75], [0.75, 1], [0.95, 0.85], [1, 0]];
const K_TRAIL = [[0, 0], [0.05, 1], [0.25, 0.75], [0.8, 0.45], [1, 0]];           // ponta para trás (frade, cirurgião)
const FISH_GEO = {
  // ---- Costa Verde ----
  sargo: { brow: 0.15 },
  marimba: { h: 0.42, brow: 0.1 },
  salema: { h: 0.36, w: 0.12, pk: 0.8 },
  cocoroca: { h: 0.38, jaw: 0.4, brow: 0.2 },
  canhanha: { h: 0.42, brow: 0.12 },
  pampo: { h: 0.52, brow: 0.2, tailH: 0.27, fins: [[0.22, 0.6, 2.2, K_SICKLE], [0.2, 0.56, 2.0, K_SICKLE, true], [0.62, 0.72, 0.5, [[0, 0], [0.5, 1], [1, 0]]]] },
  budiao: { brow: 0.3, tip: 0.13, mid: 0.14 },
  frade: { h: 0.7, jaw: 0.1, brow: 0.2, fins: [[0.12, 0.68, 1.1, K_TRAIL], [0.12, 0.5, 1.0, K_TRAIL, true]] },
  peixegalo: { h: 0.8, w: 0.06, pk: 0.75, brow: 0.55, jaw: 0.7, tailH: 0.2, fins: [[0.2, 0.6, 2.6, K_FILA], [0.2, 0.55, 2.4, K_FILA, true]] },
  cangulo: { h: 0.5, w: 0.1, pk: 0.68, jaw: 0.0, brow: 0.15, snout: 0.03, fork: false, tip: 0.12, mid: 0.11, tailH: 0.17,
    fins: [[0.62, 0.72, 0.9, [[0, 0], [0.2, 0.4], [0.85, 1], [1, 0]]], [0.12, 0.44, 1.0, K_SOFT], [0.12, 0.42, 1.0, K_SOFT, true]] },
  garoupa: { h: 0.31, jaw: 1.3 },
  badejo: { h: 0.26, w: 0.15, jaw: 1.1, pk: 0.74, dors: 0.07, tip: 0.13, mid: 0.13 },
  cherne: { h: 0.37, w: 0.17, brow: 0.12, jaw: 1.2, tailH: 0.17 },
  mero: { h: 0.38, w: 0.23, pk: 0.62, jaw: 1.6, pec: 0.17, dors: 0.07, tailH: 0.16, brow: 0.08 },
  caranha: { h: 0.37, brow: 0.22, jaw: 1.15, dors: 0.1 },
  cioba: { h: 0.33, tailH: 0.21, tip: 0.2, mid: 0.06 },
  dentao: { h: 0.38, brow: 0.3, jaw: 1.2 },
  robalo: { h: 0.24, jaw: 1.3, snout: 0.015, pk: 0.76, brow: -0.1 },
  tainha: { h: 0.2, w: 0.14, pk: 0.7, jaw: 0.0, brow: 0.22, tailH: 0.17 },
  enchova: { h: 0.23, jaw: 1.35, pk: 0.76 },
  sororoca: { finlets: 7, keel: 0.012, snout: 0.01 },
  xareu: { h: 0.42, brow: 0.7, keel: 0.016, tailH: 0.28, tip: 0.21, mid: 0.06 },
  olhodeboi: { keel: 0.014, brow: 0.08 },
  olhete: { keel: 0.012, h: 0.24 },
  dourado: { brow: 1.15, h: 0.29, tip: 0.21, mid: 0.06 },
  bicuda: { snout: 0.04 },
  albacora: { finlets: 8, keel: 0.022, pec: 0.27, tip: 0.2, mid: 0.04 },
  atumrabino: { finlets: 8, keel: 0.026, tip: 0.21, mid: 0.04 },
  // ---- Costa dos Corais ----
  guaiuba: { h: 0.3, tailH: 0.27, tip: 0.23, mid: 0.05, pk: 0.8 },
  ariaco: { h: 0.32, brow: 0.12 },
  cavala: { h: 0.16, finlets: 8, keel: 0.012, snout: 0.03, tip: 0.2, mid: 0.04 },
  saramunete: { h: 0.22, pk: 0.72, jaw: 0.0, brow: 0.28, barbels: true },
  garoupagato: { h: 0.3, w: 0.17, jaw: 1.2 },
  pargo: { h: 0.4, brow: 0.35, tailH: 0.2 },
  budiaoazul: { brow: 0.45, tip: 0.14, mid: 0.11, tailH: 0.2 },
  cirurgiao: { h: 0.56, jaw: 0.0, snout: 0.01, brow: 0.2, tip: 0.17, mid: 0.07, fork: true, fins: [[0.12, 0.72, 0.6, K_SOFT], [0.12, 0.5, 0.6, K_SOFT, true]] },
  // ---- Amazonas ----
  tambaqui: { h: 0.48, brow: 0.15, jaw: 0.3 },
  pacu: { h: 0.54, brow: 0.22, jaw: 0.2 },
  piranha: { h: 0.45, jaw: 1.7, brow: 0.3 },
  matrinxa: { h: 0.28, pk: 0.8 },
  pescada: { h: 0.27, jaw: 1.0, pk: 0.76, fork: false, tip: 0.14, mid: 0.17 },
  apapa: { h: 0.33, jaw: 1.25, brow: -0.15 },
  aracu: { h: 0.25, jaw: 0.15, brow: 0.12 },
  jaraqui: { h: 0.29, tailH: 0.22, tip: 0.21, mid: 0.06 },
  douradorio: { h: 0.27, jaw: 0.95, brow: 0.1 },
  cachorra: { h: 0.21, jaw: 1.9, brow: -0.1 },
  bicudario: { snout: 0.035 },
};
// formato final de uma espécie: base + ajustes dela
function shapeOf(key, shape) { const b = SHAPES[shape], o = FISH_GEO[key]; return o ? Object.assign({}, b, o) : b; }
