import test from "node:test";
import assert from "node:assert/strict";
import { silabear, analizarVerso, analizarHaiku, validaCorreccion, rimaPalabras } from "./metrica.js";

const sil = (w) => silabear(w).silabas.map((s) => s.texto).join("-");
const ton = (w) => { const r = silabear(w); return r.silabas[r.tonica].texto; };

test("silabeo de palabras", () => {
  const casos = {
    estanque: "es-tan-que", viejo: "vie-jo", silencio: "si-len-cio", pájaro: "pá-ja-ro",
    calor: "ca-lor", canción: "can-ción", país: "pa-ís", día: "dí-a", construir: "cons-truir",
    instante: "ins-tan-te", inmóvil: "in-mó-vil", reflejo: "re-fle-jo", superficie: "su-per-fi-cie",
    ahumado: "a-hu-ma-do", pingüino: "pin-güi-no", queso: "que-so", guerra: "gue-rra",
    chico: "chi-co", calle: "ca-lle", hoy: "hoy", rey: "rey", cielo: "cie-lo", poeta: "po-e-ta",
    aire: "ai-re", ruido: "rui-do", agua: "a-gua", lluvia: "llu-via", atlas: "at-las",
    obstáculo: "obs-tá-cu-lo", transporte: "trans-por-te", abstracto: "abs-trac-to",
    perspectiva: "pers-pec-ti-va", cohete: "co-he-te", actriz: "ac-triz", leía: "le-í-a",
    raíz: "ra-íz", baúl: "ba-úl", oír: "oír".replace("oír", "o-ír"), huevo: "hue-vo", hielo: "hie-lo",
    murciélago: "mur-cié-la-go", buey: "buey", guion: "guion", ciudad: "ciu-dad", muy: "muy",
    otoño: "o-to-ño", lago: "la-go", tiempo: "tiem-po", ñandú: "ñan-dú", cuídate: "cuí-da-te",
    tranquilo: "tran-qui-lo", enclave: "en-cla-ve", amplio: "am-plio", sombra: "som-bra",
  };
  for (const [w, e] of Object.entries(casos)) assert.equal(sil(w), e, w);
});

test("sílaba tónica", () => {
  assert.equal(ton("pájaro"), "pá");
  assert.equal(ton("calor"), "lor");
  assert.equal(ton("lago"), "la");
  assert.equal(ton("canción"), "ción");
  assert.equal(ton("hoy"), "hoy");
  assert.equal(ton("murciélago"), "cié");
});

const cuenta = (v, e) => analizarVerso(v, e);

test("versos clásicos 5-7-5", () => {
  const h = [
    ["Un viejo estanque", 5], ["salta una rana al agua", 7], ["suena el silencio", 5],
    ["Tarde de otoño", 5], ["Sobre la rama un cuervo", 7], ["Bruma en el valle", 5],
    ["Cerezo en flor", 5], ["Pétalos sobre el agua", 7], ["Nadie los mira", 5],
    ["duda de otoño", 5], ["se ha detenido el lago", 7], ["o ha sido el tiempo", 5],
    ["hace calor", 5],
  ];
  for (const [v, e] of h) { const r = cuenta(v, e); assert.equal(r.porDefecto, e, `${v} → ${r.desglose}`); assert.ok(r.correcto); }
});

test("dialefa como licencia, indicada en el desglose", () => {
  const r = cuenta("canta un pájaro", 5); // con sinalefa son 4; con dialefa, 5
  assert.equal(r.porDefecto, 4);
  assert.ok(r.correcto);
  assert.match(r.desglose, /dialefa/);
});

test("el caso del lago ya no falla", () => {
  const a = analizarHaiku("duda de otoño?\nse ha detenido el lago\no ha sido el tiempo?");
  assert.deepEqual(a.versos.map((v) => v.correcto), [true, true, true]);
  assert.equal(a.rimas.length, 0);
});

test("versos incorrectos se detectan", () => {
  const r = cuenta("Pienso en ti siempre cuando brilla", 5);
  assert.equal(r.correcto, false);
  assert.ok(r.cuenta > 5);
});

test("rima", () => {
  const r = (a, b) => rimaPalabras(silabear(a), silabear(b));
  assert.equal(r("otoño", "tiempo"), null);
  assert.equal(r("lago", "tiempo"), null);
  assert.equal(r("lago", "pago"), "consonante");
  assert.equal(r("casa", "playa"), "asonante");
  assert.equal(r("flor", "calor"), "consonante");
  assert.equal(r("sol", "amor"), "asonante");
  assert.equal(r("fuego", "viento"), "asonante");
  assert.equal(r("luna", "cuna"), "consonante");
  assert.equal(r("agua", "agua"), null);
});

test("validación de versión sugerida", () => {
  assert.ok(validaCorreccion("Tarde de otoño\nsobre la rama un cuervo\nbruma en el valle").ok);
  const mala = validaCorreccion("lago de otoño\nsu superficie inmóvil refleja\nel cielo");
  assert.equal(mala.ok, false);
});
