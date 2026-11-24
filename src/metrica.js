// Métrica española determinista: silabeo, sinalefa, acento final y rima.
// El modelo de lenguaje NO cuenta sílabas ni detecta rimas bien; esto lo hace el código.

const VOCALES = "aeiouáéíóúü";
const FUERTES = "aeoáéó";
const TILDE = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" };
const sinTilde = (s) => s.replace(/[áéíóúü]/g, (c) => TILDE[c]);
const esVocal = (c) => !!c && VOCALES.includes(c);

// Monosílabos átonos: si cierran el verso no se aplica ajuste por acento final.
const ATONAS = new Set([
  "el", "la", "los", "las", "un", "de", "del", "a", "al", "en", "y", "e", "o", "u",
  "que", "se", "me", "te", "le", "lo", "les", "su", "sus", "mi", "mis", "tu", "tus",
  "con", "por", "sin", "si", "ni", "nos", "os",
]);

// ───────────────────────── Silabeo ─────────────────────────

// Divide la palabra en unidades: vocales (fuerte "f", débil "d", débil con tilde "da")
// y consonantes (los dígrafos ch, ll, rr, qu, gu+e/i cuentan como una).
function unidades(w) {
  const u = [];
  let i = 0;
  while (i < w.length) {
    const c = w[i], n = w[i + 1], d = c + (n || ""), s2 = w[i + 2] || "#";
    if ((c === "q" || c === "g") && n === "u" && "eéií".includes(s2)) { u.push({ t: "C", s: d }); i += 2; continue; }
    if (d === "ch" || d === "ll" || d === "rr") { u.push({ t: "C", s: d }); i += 2; continue; }
    if (FUERTES.includes(c)) { u.push({ t: "V", s: c, k: "f", ac: "áéó".includes(c) }); i++; continue; }
    if (c === "í" || c === "ú") { u.push({ t: "V", s: c, k: "da", ac: true }); i++; continue; }
    if (c === "i" || c === "u" || c === "ü") { u.push({ t: "V", s: c, k: "d", ac: false }); i++; continue; }
    if (c === "y" && i === w.length - 1) { u.push({ t: "V", s: c, k: "d", ac: false }); i++; continue; } // hoy, rey, y
    u.push({ t: "C", s: c });
    i++;
  }
  return u;
}

const baseV = (x) => ({ í: "i", ú: "u", ü: "u", y: "i" }[x.s] || x.s);

// ¿La vocal v se une al núcleo silábico en curso (diptongo/triptongo) o forma hiato?
function une(nuc, v) {
  const prev = nuc[nuc.length - 1];
  const pf = prev.k === "f", vf = v.k === "f";
  if (pf && vf) return false;                         // hiato: dos fuertes
  if (pf) return v.k === "d";                         // ai, au… (débil con tilde = hiato: aí)
  if (vf) return prev.k === "d" && nuc.every((x) => x.k !== "f"); // ia, ue, uai… (í/ú + fuerte = hiato)
  return baseV(prev) !== baseV(v);                    // débil + débil (ui, iu), no igual
}

// Grupos de consonantes inseparables: pr br fr gr cr kr pl bl fl gl cl kl tr dr
const grupo = (a, b) =>
  (/^[pbfgck]$/.test(a) && /^[lr]$/.test(b)) || ((a === "t" || a === "d") && b === "r");

export function silabear(palabra) {
  const w = palabra.toLowerCase().normalize("NFC");
  const u = unidades(w);

  const nucleos = [];
  for (let i = 0; i < u.length; ) {
    if (u[i].t !== "V") { i++; continue; }
    const nuc = [u[i]];
    let j = i;
    while (j + 1 < u.length && u[j + 1].t === "V" && une(nuc, u[j + 1])) { nuc.push(u[j + 1]); j++; }
    nucleos.push({ ini: i, fin: j + 1 });
    i = j + 1;
  }
  if (!nucleos.length) {
    return { palabra: w, silabas: [{ texto: w, us: u }], tonica: 0, k: 0 };
  }

  const cortes = [];
  for (let k = 0; k < nucleos.length - 1; k++) {
    const a = nucleos[k].fin, b = nucleos[k + 1].ini, n = b - a;
    if (n === 0) cortes.push(b);
    else if (n === 1) cortes.push(a);
    else if (n === 2) cortes.push(grupo(u[a].s, u[a + 1].s) ? a : a + 1);
    else cortes.push(grupo(u[b - 2].s, u[b - 1].s) ? b - 2 : b - 1);
  }
  const silabas = [];
  let ini = 0;
  for (const c of [...cortes, u.length]) {
    const us = u.slice(ini, c);
    silabas.push({ texto: us.map((x) => x.s).join(""), us });
    ini = c;
  }

  let tonica = silabas.findIndex((s) => s.us.some((x) => x.t === "V" && x.ac));
  if (tonica < 0) {
    const llana = /[aeiouáéíóúüns]$/.test(w); // termina en vocal, n o s → llana; resto → aguda
    tonica = silabas.length > 1 ? (llana ? silabas.length - 2 : silabas.length - 1) : 0;
  }
  return { palabra: w, silabas, tonica, k: silabas.length - 1 - tonica };
}

// ───────────────────────── Verso ─────────────────────────

const PAUSA = /[,.;:?!…—–]/;

function palabrasDe(verso) {
  const ms = [...verso.matchAll(/\p{L}+/gu)];
  return ms.map((m, i) => {
    const sig = ms[i + 1];
    const entre = verso.slice(m.index + m[0].length, sig ? sig.index : verso.length);
    return { texto: m[0], pausa: PAUSA.test(entre) };
  });
}
const terminaV = (p) => { const l = p.texto.toLowerCase().slice(-1); return esVocal(l) || l === "y"; };
const empiezaV = (p) => {
  const t = p.texto.toLowerCase();
  if (t === "y") return true;
  return esVocal(t[0] === "h" ? t[1] : t[0]);
};
const TIPO = ["aguda", "llana", "esdrújula", "sobresdrújula"];

export function analizarVerso(verso, esperadas) {
  const ps = palabrasDe(verso).map((p) => ({ ...p, ...silabear(p.texto) }));
  if (!ps.length) return null;

  const bruto = ps.reduce((n, p) => n + p.silabas.length, 0);
  const ult = ps[ps.length - 1];
  const atona = ult.silabas.length === 1 && ATONAS.has(ult.palabra);
  const ajuste = atona ? 0 : 1 - ult.k; // aguda +1, llana 0, esdrújula −1…

  const juntas = [];
  for (let i = 0; i < ps.length - 1; i++) {
    juntas.push({ i, posible: terminaV(ps[i]) && empiezaV(ps[i + 1]), pausa: ps[i].pausa });
  }
  const posibles = juntas.filter((j) => j.posible);
  // La dialefa es más natural cuando una de las vocales del encuentro es tónica.
  const tonicoBorde = (j) => ps[j.i].k === 0 || ps[j.i + 1].tonica === 0;
  const defecto = posibles.filter((j) => !j.pausa).sort((a, b) => tonicoBorde(a) - tonicoBorde(b));
  const trasPausa = posibles.filter((j) => j.pausa);

  const porDefecto = bruto - defecto.length + ajuste;
  let usadas = new Set(defecto.map((j) => j.i));
  let cuenta = porDefecto;
  let correcto = porDefecto === esperadas;
  let licencia = "";

  if (!correcto) {
    // La sinalefa/dialefa es licencia optativa: ¿hay alguna lectura que dé la medida?
    const s = bruto + ajuste - esperadas;
    if (s >= 0 && s <= posibles.length) {
      const orden = [...defecto, ...trasPausa];
      usadas = new Set(orden.slice(0, s).map((j) => j.i));
      cuenta = esperadas;
      correcto = true;
      const dial = defecto.filter((j) => !usadas.has(j.i));
      const extra = trasPausa.filter((j) => usadas.has(j.i));
      const par = (j) => `«${ps[j.i].texto} ${ps[j.i + 1].texto}»`;
      if (dial.length) licencia += `dialefa en ${dial.map(par).join(", ")}`;
      if (extra.length) licencia += `${licencia ? "; " : ""}sinalefa pese a la pausa en ${extra.map(par).join(", ")}`;
    }
  }

  const desglose = (() => {
    let txt = "";
    ps.forEach((p, i) => {
      txt += p.silabas.map((s) => s.texto).join("-");
      if (i < ps.length - 1) txt += usadas.has(i) ? "_" : " ";
    });
    const det = [];
    const sin = [...usadas].sort((a, b) => a - b).map((i) => `«${ps[i].texto} ${ps[i + 1].texto}»`);
    if (sin.length) det.push(`sinalefa en ${sin.join(", ")}`);
    if (licencia) det.push(`licencia: ${licencia}`);
    const tipo = TIPO[Math.min(ult.k, 3)];
    det.push(atona ? `acaba en átona «${ult.palabra}», sin ajuste`
      : ajuste === 0 ? `«${ult.palabra}» llana, sin ajuste`
      : `«${ult.palabra}» ${tipo}, ${ajuste > 0 ? "+" : "−"}${Math.abs(ajuste)}`);
    if (!correcto) {
      const min = bruto - posibles.length + ajuste, max = bruto + ajuste;
      if (min !== max) det.push(`según las sinalefas, entre ${min} y ${max}`);
    }
    return `${txt} = ${cuenta} sílabas (${det.join("; ")})`;
  })();

  return { verso: verso.trim(), palabras: ps, esperadas, cuenta, porDefecto, correcto, desglose };
}

// ───────────────────────── Rima ─────────────────────────

const principal = (us) => {
  let i = us.findIndex((x) => x.t === "V" && (x.k === "f" || x.k === "da"));
  if (i < 0) for (let j = us.length - 1; j >= 0; j--) if (us[j].t === "V") { i = j; break; }
  return i;
};

// Desde la vocal tónica: consonante = todas las letras; asonante = solo las vocales.
export function terminacion(pal) {
  const sil = pal.silabas, t = sil[pal.tonica];
  const i0 = principal(t.us);
  const resto = [t.us.slice(Math.max(i0, 0)), ...sil.slice(pal.tonica + 1).map((s) => s.us)].flat();
  const cons = sinTilde(resto.map((x) => x.s).join(""));
  const vocal = (us) => { const j = principal(us); return j >= 0 ? sinTilde(baseV(us[j])) : ""; };
  const aso = [vocal(t.us), ...sil.slice(pal.tonica + 1).map((s) => vocal(s.us))].join("");
  return { cons, aso };
}

export function rimaPalabras(a, b) {
  if (!a || !b || a.palabra === b.palabra) return null;
  const x = terminacion(a), y = terminacion(b);
  if (x.cons === y.cons) return "consonante";
  if (x.aso && x.aso === y.aso) return "asonante";
  return null;
}

// ───────────────────────── Haiku ─────────────────────────

const ESPERADAS = [5, 7, 5];

export function analizarHaiku(texto) {
  const lineas = String(texto).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const versos = lineas.slice(0, 3).map((l, i) =>
    analizarVerso(l, ESPERADAS[i]) ||
    { verso: l, palabras: [], esperadas: ESPERADAS[i], cuenta: 0, porDefecto: 0, correcto: false, desglose: "Sin sílabas reconocibles" });
  const rimas = [];
  for (let a = 0; a < versos.length; a++) {
    for (let b = a + 1; b < versos.length; b++) {
      const pa = versos[a].palabras.at(-1), pb = versos[b].palabras.at(-1);
      const tipo = rimaPalabras(pa, pb);
      if (tipo) rimas.push({ a: a + 1, b: b + 1, tipo, pa: pa.texto, pb: pb.texto });
    }
  }
  return { lineas, versos, rimas, nVersos: lineas.length };
}

// Aciertos/errores de métrica y rima, generados por código.
export function resumenMetrico(an) {
  const aciertos = [], errores = [];
  if (an.nVersos !== 3) errores.push(`Un haiku tiene tres versos y aquí hay ${an.nVersos}.`);
  const todos = an.versos.length === 3 && an.versos.every((v) => v.correcto);
  if (todos) aciertos.push("Métrica 5-7-5 correcta");
  else an.versos.forEach((v, i) => {
    if (!v.correcto) errores.push(`Verso ${i + 1}: ${v.cuenta} sílabas en lugar de ${v.esperadas}.`);
  });
  if (!an.rimas.length) aciertos.push("Sin rima asonante ni consonante entre versos");
  else an.rimas.forEach((r) =>
    errores.push(`Rima ${r.tipo} entre los versos ${r.a} y ${r.b} («${r.pa}» / «${r.pb}»).`));
  return { aciertos, errores };
}

export function puntuar(an, { kigo, yo, metafora }) {
  let p = 10;
  an.versos.forEach((v) => { if (!v.correcto) p -= Math.min(2, Math.abs(v.cuenta - v.esperadas) || 1); });
  if (an.nVersos < 3) p -= 2 * (3 - an.nVersos);
  if (an.nVersos > 3) p -= 2;
  if (an.rimas.length) p -= 1;
  if (yo) p -= 1;
  if (!kigo) p -= 1.5;
  if (metafora) p -= 1;
  return Math.max(0, Math.round(p));
}

// Datos exactos para el modelo (no debe recalcularlos).
export function datosParaModelo(an) {
  const l = an.versos.map((v, i) =>
    `Verso ${i + 1} «${v.verso}»: ${v.cuenta} sílabas (esperadas ${v.esperadas}) → ${v.correcto ? "correcto" : "INCORRECTO"}`);
  if (an.nVersos !== 3) l.push(`El texto tiene ${an.nVersos} versos (debería tener 3).`);
  l.push(an.rimas.length
    ? "Rima entre versos: " + an.rimas.map((r) => `${r.tipo} entre ${r.a} y ${r.b} («${r.pa}» / «${r.pb}»)`).join("; ")
    : "Rima entre versos: ninguna");
  return l.join("\n");
}

// Valida una versión sugerida: 3 versos, 5-7-5 con las sinalefas habituales y sin rima.
const soloLetras = (t) => String(t).toLowerCase().replace(/[^\p{L}]/gu, "");

export function validaCorreccion(texto, original = "") {
  const an = analizarHaiku(texto);
  const problemas = [];
  if (original && soloLetras(texto) === soloLetras(original)) {
    problemas.push("es igual al original (solo cambia la puntuación): reescríbela de verdad");
  }
  if (an.nVersos !== 3) problemas.push(`tiene ${an.nVersos} versos, debe tener 3`);
  an.versos.forEach((v, i) => {
    if (v.porDefecto !== v.esperadas) problemas.push(`verso ${i + 1} «${v.verso}» mide ${v.porDefecto} sílabas, debe medir ${v.esperadas}`);
  });
  an.rimas.forEach((r) => problemas.push(`riman (${r.tipo}) los versos ${r.a} y ${r.b}: «${r.pa}» / «${r.pb}»`));
  return { ok: problemas.length === 0, problemas };
}
