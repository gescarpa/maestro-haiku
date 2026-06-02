import { useState, useEffect, useRef } from "react";

const CYCLE_MS = 12 * 60 * 1000;

function skyAt(t) {
  const stops = [
    { t:0.00, bg:"#f5f0e8", text:"#2c2416", subtle:"#8a7450", border:"#c8b888", paper:"#faf7f0", kanji:"#c8b070" },
    { t:0.30, bg:"#e8d8b8", text:"#3a2c14", subtle:"#8a6030", border:"#c0a060", paper:"#f5ead0", kanji:"#c89040" },
    { t:0.42, bg:"#c87840", text:"#2a1808", subtle:"#7a4020", border:"#a06030", paper:"#e09040", kanji:"#f0a050" },
    { t:0.50, bg:"#903050", text:"#1a0810", subtle:"#6a2840", border:"#7a3848", paper:"#c04858", kanji:"#e07080" },
    { t:0.60, bg:"#281828", text:"#c8b8d8", subtle:"#8878a0", border:"#483858", paper:"#302038", kanji:"#a890c0" },
    { t:0.75, bg:"#100c18", text:"#d0c8e0", subtle:"#786890", border:"#302840", paper:"#18101e", kanji:"#806898" },
    { t:0.85, bg:"#100c18", text:"#d0c8e0", subtle:"#786890", border:"#302840", paper:"#18101e", kanji:"#806898" },
    { t:0.93, bg:"#1a1428", text:"#c8b8c8", subtle:"#806878", border:"#382838", paper:"#201820", kanji:"#907080" },
    { t:1.00, bg:"#f5f0e8", text:"#2c2416", subtle:"#8a7450", border:"#c8b888", paper:"#faf7f0", kanji:"#c8b070" },
  ];
  let a = stops[0], b = stops[stops.length-1];
  for (let i=0; i<stops.length-1; i++) { if (t>=stops[i].t && t<=stops[i+1].t){a=stops[i];b=stops[i+1];break;} }
  const f = a.t===b.t ? 0 : (t-a.t)/(b.t-a.t);
  const lc = (ca,cb) => { const pa=ph(ca),pb=ph(cb); return th(pa.map((v,i)=>Math.round(v+(pb[i]-v)*f))); };
  return { bg:lc(a.bg,b.bg), text:lc(a.text,b.text), subtle:lc(a.subtle,b.subtle), border:lc(a.border,b.border), paper:lc(a.paper,b.paper), kanji:lc(a.kanji,b.kanji), t };
}
function ph(h){ const s=h.replace("#",""); return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)]; }
function th([r,g,b]){ return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,"0")).join(""); }
function bww(hex,amt){ const [r,g,b]=ph(hex); return th([Math.round(r+(255-r)*amt),Math.round(g+(255-g)*amt),Math.round(b+(255-b)*amt)]); }
function h2rgb(hex){ return ph(hex).join(","); }

// Divisor decorativo: una línea con ✦ en el centro
function Orn({ border, subtle, style={} }) {
  return (
    <div style={{ display:"flex", alignItems:"center", margin:"28px 0", ...style }}>
      <div style={{ flex:1, height:"1px", background:border }} />
      <span style={{ padding:"0 14px", fontSize:"13px", color:subtle, lineHeight:1 }}>✦</span>
      <div style={{ flex:1, height:"1px", background:border }} />
    </div>
  );
}

const STARS = Array.from({length:55},()=>({ x:Math.random()*100, y:Math.random()*60, r:0.5+Math.random()*1.2, tw:0.6+Math.random()*0.4, ph:Math.random()*Math.PI*2 }));

function SkyCanvas({ skyRef }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const resize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize(); window.addEventListener("resize",resize);
    const draw=(ts)=>{
      const sky=skyRef.current; const t=sky.t; const W=canvas.width,H=canvas.height;
      ctx.clearRect(0,0,W,H);
      const gr=ctx.createLinearGradient(0,0,0,H);
      gr.addColorStop(0,sky.bg); gr.addColorStop(1,bww(sky.bg,0.18));
      ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
      const sa = t>0.55&&t<0.93 ? (t<0.65?(t-0.55)/0.10 : t>0.86?1-(t-0.86)/0.07 : 1) : 0;
      if(sa>0.01) STARS.forEach(s=>{
        const tw=0.6+0.4*Math.sin(ts*0.001*s.tw+s.ph);
        ctx.beginPath(); ctx.arc(s.x/100*W,s.y/100*H*0.7,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,248,230,${sa*tw*0.9})`; ctx.fill();
      });
      const sunY=H*0.18;
      if(t<0.46||t>0.88){
        const st=t<0.46?t/0.46:(t-0.88)/0.12;
        const sx=W*(0.12+st*0.76);
        const sal=t<0.38?1:t<0.46?1-(t-0.38)/0.08:(t-0.88)/0.12;
        const hl=ctx.createRadialGradient(sx,sunY,0,sx,sunY,60);
        hl.addColorStop(0,`rgba(255,220,120,${sal*0.25})`); hl.addColorStop(1,`rgba(255,200,80,0)`);
        ctx.fillStyle=hl; ctx.beginPath(); ctx.arc(sx,sunY,60,0,Math.PI*2); ctx.fill();
        const dc=ctx.createRadialGradient(sx-3,sunY-3,1,sx,sunY,18);
        dc.addColorStop(0,`rgba(255,248,200,${sal})`); dc.addColorStop(1,`rgba(240,180,60,${sal*0.9})`);
        ctx.fillStyle=dc; ctx.beginPath(); ctx.arc(sx,sunY,18,0,Math.PI*2); ctx.fill();
      }
      if(t>0.52&&t<0.92){
        const mt=t<0.65?(t-0.52)/0.13:t>0.84?1-(t-0.84)/0.08:1;
        const mx=W*0.72,my=H*0.14;
        const mh=ctx.createRadialGradient(mx,my,0,mx,my,40);
        mh.addColorStop(0,`rgba(200,190,240,${mt*0.12})`); mh.addColorStop(1,`rgba(180,170,220,0)`);
        ctx.fillStyle=mh; ctx.beginPath(); ctx.arc(mx,my,40,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(235,230,215,${mt*0.92})`; ctx.beginPath(); ctx.arc(mx,my,13,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(${h2rgb(sky.bg)},${mt*0.88})`; ctx.beginPath(); ctx.arc(mx+5,my-2,11,0,Math.PI*2); ctx.fill();
      }
      animRef.current=requestAnimationFrame(draw);
    };
    animRef.current=requestAnimationFrame(draw);
    return()=>{ cancelAnimationFrame(animRef.current); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}}/>;
}

const PC_DAY   = ["#f2cdd4","#edd5db","#f7dde2","#e8c4cc","#f0d0d8","#fae0e5"];
const PC_NIGHT = ["#c090a8","#b07888","#a86878","#c0a0b0","#d0b0c0","#b898a8"];
function pSVG(color){ const c=encodeURIComponent(color),v=encodeURIComponent("#c49aa0"); return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 32'><ellipse cx='12' cy='16' rx='7' ry='13' fill='${c}' opacity='0.88'/><line x1='12' y1='4' x2='12' y2='28' stroke='${v}' stroke-width='0.6' opacity='0.5'/><line x1='12' y1='12' x2='7' y2='20' stroke='${v}' stroke-width='0.4' opacity='0.4'/><line x1='12' y1='12' x2='17' y2='20' stroke='${v}' stroke-width='0.4' opacity='0.4'/></svg>`; }

function PetalCanvas({ mousePos, mainRect, skyRef }) {
  const [petals,setPetals]=useState([]);
  const idRef=useRef(0); const animRef=useRef(null);
  useEffect(()=>{
    const spawn=()=>{
      const id=idRef.current++;
      const night=skyRef.current.t>0.6&&skyRef.current.t<0.92;
      const pal=night?PC_NIGHT:PC_DAY;
      const color=pal[Math.floor(Math.random()*pal.length)];
      const size=14+Math.random()*16;
      setPetals(p=>[...p,{id,color,size,x:Math.random()*window.innerWidth,y:-40,vx:(Math.random()-.5)*.6,vy:.5+Math.random()*.8,rot:Math.random()*360,vrot:(Math.random()-.5)*2.5,opacity:0,age:0}]);
    };
    for(let i=0;i<10;i++) setTimeout(spawn,i*500);
    const iv=setInterval(spawn,1000); return()=>clearInterval(iv);
  },[]);
  useEffect(()=>{
    const tick=()=>{
      const mx=mousePos.current.x,my=mousePos.current.y,rect=mainRect.current;
      setPetals(prev=>prev.map(p=>{
        const dx=mx-p.x,dy=my-p.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
        const force=Math.min(60/(dist*dist),.08);
        let nvx=p.vx+dx/dist*force, nvy=p.vy+dy/dist*force+.018;
        if(rect){
          const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
          const hw=rect.width/2+30,hh=rect.height/2+30;
          const bx=p.x-cx,by=p.y-cy;
          if(Math.abs(bx)<hw&&Math.abs(by)<hh){
            if(hw-Math.abs(bx)<hh-Math.abs(by)) nvx+=(bx>0?1:-1)*.5;
            else nvy+=(by>0?1:-1)*.5;
          }
        }
        nvx*=.97; nvy=Math.min(nvy*.98,2.5);
        const nage=p.age+1;
        return{...p,x:p.x+nvx,y:p.y+nvy,vx:nvx,vy:nvy,rot:p.rot+p.vrot,age:nage,opacity:nage<30?nage/30*.85:p.opacity};
      }).filter(p=>p.y<window.innerHeight+60&&p.x>-60&&p.x<window.innerWidth+60));
      animRef.current=requestAnimationFrame(tick);
    };
    animRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(animRef.current);
  },[]);
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
      {petals.map(p=>(
        <img key={p.id} src={pSVG(p.color)} style={{position:"absolute",left:p.x-p.size/2,top:p.y-p.size*.67,width:p.size,height:p.size*1.35,transform:`rotate(${p.rot}deg)`,opacity:p.opacity,filter:"drop-shadow(0 1px 2px rgba(180,120,130,0.18))",willChange:"transform,opacity"}}/>
      ))}
    </div>
  );
}

function getSeason() {
  const m = new Date().getMonth()+1;
  if(m>=3&&m<=5) return "primavera";
  if(m>=6&&m<=8) return "verano";
  if(m>=9&&m<=11) return "otoño";
  return "invierno";
}

const BASHO_POOL = [
  { texto: "Un viejo estanque.\nSe zambulle una rana.\nRuido de agua." },
  { texto: "Tarde de otoño.\nSobre la rama un cuervo.\nBruma en el valle." },
  { texto: "Cerezo en flor.\nPétalos sobre el agua.\nNadie los mira." },
];
const ERROR_POOL = [
  { texto: "Pienso en ti siempre.\nCuando la luna de plata\nbrilla en el cielo." },
  { texto: "Tus ojos son dos lunas.\nEl mar me llama a lo lejos.\nVuelvo a recordar." },
  { texto: "Miro las estrellas.\nBrillo de mil luces blancas.\nRezando mis cruces." },
];
const SEASON_POOL = {
  primavera: [
    { texto: "Llega la avispa.\nPoliniza el higo verde.\nPolvo amarillo." },
    { texto: "Flores de almendro.\nNieva sobre el camino.\nNadie esperaba." },
  ],
  verano: [
    { texto: "Calor de agosto.\nLa cigarra no calla.\nSombra de pino." },
    { texto: "Noche de julio.\nVuela un murciélago negro.\nLa luna llena." },
  ],
  otoño: [
    { texto: "Tarde de otoño.\nSobre la rama un cuervo.\nBruma en el valle." },
    { texto: "Niebla de otoño.\nAlguien quemó las hojas.\nOlor a humo." },
  ],
  invierno: [
    { texto: "Frío de enero.\nHuellas sobre la nieve.\nNadie regresó." },
    { texto: "Noche de invierno.\nUn gato en las brasas.\nHilo de humo." },
  ],
};

const SYSTEM_PROMPT = `Eres un maestro del haiku japonés clásico. Analizas haikus en español con rigor absoluto.

REGLAS DEL HAIKU:
1. MÉTRICA 5-7-5. Cuenta sílabas con estas reglas SIN EXCEPCIÓN:
   - Sinalefa: vocal final + vocal inicial siguiente PUEDEN fusionarse (licencia optativa). Busca la lectura que cuadre 5-7-5.
   - Verso agudo (última palabra acentuada en última sílaba: "calor", "café", "canción", "aquí", "hoy"): suma 1 al total. Ej: "ha-ce ca-lor" = 4 sílabas + 1 (agudo) = 5 ✓
   - Verso esdrújulo (acento en antepenúltima: "pájaro", "música", "cálido"): resta 1 al total. Ej: "canta un pájaro" = 6 - 1 = 5 ✓
   - Verso llano (acento en penúltima, lo habitual): cuenta normal, sin ajuste.
2. Sin yo/autor: no primera persona.
3. Kigo: referencia estacional clara.
4. Sin rima asonante ni consonante entre versos.
5. Sin metáfora: todo literal y sensorial.

PARA haiku_corregido — PROCESO OBLIGATORIO:
El proceso de verificación es INTERNO y NUNCA aparece en la respuesta JSON.
Verifica mentalmente cada verso candidato antes de incluirlo:
  a) Cuenta sílabas brutas
  b) Aplica sinalefas si las hay
  c) Ajusta por acento final (+1 agudo, -1 esdrújulo, 0 llano)
  d) ¿Es exactamente 5 o 7? Si NO → descarta y prueba otro verso
Solo cuando los tres versos cumplan 5-7-5 escribe haiku_corregido como string simple con saltos de línea, sin campos extra, sin verificaciones, sin notas. Exactamente así:
  "haiku_corregido": "verso uno\nverso dos\nverso tres"
Si no encuentras corrección válida, escribe:
  "haiku_corregido": null

Responde ÚNICAMENTE con JSON válido, sin texto, sin markdown:
{
  "puntuacion": 8,
  "versos": [
    {"verso": "texto", "silabas_contadas": 5, "silabas_esperadas": 5, "correcto": true, "desglose": "síl-a-bas con ajuste explicado"},
    {"verso": "texto", "silabas_contadas": 7, "silabas_esperadas": 7, "correcto": true, "desglose": "síl-a-bas con ajuste explicado"},
    {"verso": "texto", "silabas_contadas": 5, "silabas_esperadas": 5, "correcto": true, "desglose": "síl-a-bas con ajuste explicado"}
  ],
  "aciertos": ["..."],
  "errores": ["..."],
  "tiene_kigo": true,
  "tiene_yo": false,
  "tiene_rima": false,
  "tiene_metafora": false,
  "nota_maestro": "...",
  "haiku_corregido": null
}`;

const FRASES_CARGA = ["El maestro medita...","Contando sílabas...","Buscando el kigo...","Escuchando el silencio...","Leyendo entre versos..."];
function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

export default function HaikuCorrector() {
  const season = getSeason();
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [fraseCarga, setFraseCarga] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [sky, setSky] = useState(()=>skyAt(0));
  const skyRef = useRef(skyAt(0));
  const mousePos = useRef({x:-999,y:-999});
  const mainRef = useRef(null);
  const mainRect = useRef(null);
  const startRef = useRef(Date.now());
  const intervaloRef = useRef(null);
  const puntosRef = useRef(null);

  const mkEjemplos = () => [
    { label:"Bashō (maestro)",    ...pickRandom(BASHO_POOL) },
    { label:"Con errores",        ...pickRandom(ERROR_POOL) },
    { label:`Haiku de ${season}`, ...pickRandom(SEASON_POOL[season]) },
  ];
  const [ejemplos, setEjemplos] = useState(mkEjemplos);

  useEffect(()=>{ const iv=setInterval(()=>setEjemplos(mkEjemplos()),45000); return()=>clearInterval(iv); },[]);
  useEffect(()=>{ const tick=()=>{ const el=(Date.now()-startRef.current)%CYCLE_MS; const s=skyAt(el/CYCLE_MS); skyRef.current=s; setSky(s); }; const iv=setInterval(tick,200); return()=>clearInterval(iv); },[]);
  useEffect(()=>{ const onMove=e=>{mousePos.current={x:e.clientX,y:e.clientY};}; window.addEventListener("mousemove",onMove); return()=>window.removeEventListener("mousemove",onMove); },[]);
  useEffect(()=>{
    if(!mainRef.current)return;
    const upd=()=>{mainRect.current=mainRef.current?.getBoundingClientRect();};
    upd(); window.addEventListener("scroll",upd); window.addEventListener("resize",upd);
    return()=>{window.removeEventListener("scroll",upd);window.removeEventListener("resize",upd);};
  },[]);
  useEffect(()=>{
    if(cargando){ setFraseCarga(0);setPuntos(0); intervaloRef.current=setInterval(()=>setFraseCarga(f=>(f+1)%FRASES_CARGA.length),1800); puntosRef.current=setInterval(()=>setPuntos(p=>(p+1)%4),400); }
    else { clearInterval(intervaloRef.current);clearInterval(puntosRef.current); }
    return()=>{clearInterval(intervaloRef.current);clearInterval(puntosRef.current);};
  },[cargando]);

  const analizar = async()=>{
    if(!texto.trim())return;
    setCargando(true);setResultado(null);setError("");
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:3000,system:SYSTEM_PROMPT,messages:[{role:"user",content:`Analiza este haiku:\n\n${texto}`}]})});
      const data=await res.json();
      if(!res.ok){setError(`Error: ${data.error?.message||JSON.stringify(data)}`);return;}
      const raw = data.content?.find(b=>b.type==="text")?.text || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) { setError("Respuesta inválida. Inténtalo de nuevo."); return; }
      let json = match[0]
        .replace(/[\u0000-\u001F\u007F]/g, m => ["\n","\r","\t"].includes(m) ? m : "")
        .replace(/,\s*([}\]])/g, "$1");
      // Intenta parsear; si falla, repara el JSON truncado
      let parsed;
      try { parsed = JSON.parse(json); }
      catch {
        // Cierra strings abiertas, arrays y objetos incompletos
        let repair = json;
        // Cuenta llaves y corchetes abiertos
        let braces = 0, brackets = 0, inStr = false, esc = false;
        for (let i = 0; i < repair.length; i++) {
          const ch = repair[i];
          if (esc) { esc = false; continue; }
          if (ch === "\\") { esc = true; continue; }
          if (ch === '"' && !esc) { inStr = !inStr; continue; }
          if (!inStr) {
            if (ch === "{") braces++;
            else if (ch === "}") braces--;
            else if (ch === "[") brackets++;
            else if (ch === "]") brackets--;
          }
        }
        // Si estábamos dentro de un string, ciérralo
        if (inStr) repair += '"';
        // Elimina comas finales que quedaron al cortar
        repair = repair.replace(/,\s*$/, "");
        // Cierra arrays y objetos abiertos
        while (brackets > 0) { repair += "]"; brackets--; }
        while (braces > 0)   { repair += "}"; braces--; }
        try { parsed = JSON.parse(repair); }
        catch (e2) { setError("JSON inválido: " + e2.message + " | Raw: " + repair.slice(0, 200));
 return; }
      }
      const str = v => (typeof v === "string" ? v : typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? ""));
      const normaliza = (p) => {
        // Normaliza array de versos
        let versos = p.versos;
        if (!Array.isArray(versos)) {
          if (versos && typeof versos === "object")
            versos = [versos.verso1, versos.verso2, versos.verso3].filter(Boolean);
          else if (p.verso1 || p.verso2)
            versos = [p.verso1, p.verso2, p.verso3].filter(Boolean);
          else versos = [];
        }
        // Sanitiza cada verso: garantiza que todos los campos son primitivos
        versos = versos.map(v => {
          if (!v || typeof v !== "object") return { verso:"", silabas_contadas:0, silabas_esperadas:5, correcto:false, desglose:"" };
          return {
            verso:            str(v.verso),
            silabas_contadas: Number(v.silabas_contadas) || 0,
            silabas_esperadas:Number(v.silabas_esperadas) || 5,
            correcto:         Boolean(v.correcto),
            desglose:         str(v.desglose ?? v.proceso ?? v.verificacion ?? ""),
          };
        });
        // Sanitiza arrays de strings
        const toStrArr = a => Array.isArray(a) ? a.map(str) : (a ? [str(a)] : []);
        return {
          puntuacion:      Number(p.puntuacion) || 0,
          versos,
          aciertos:        toStrArr(p.aciertos),
          errores:         toStrArr(p.errores),
          tiene_kigo:      Boolean(p.tiene_kigo),
          tiene_yo:        Boolean(p.tiene_yo),
          tiene_rima:      Boolean(p.tiene_rima),
          tiene_metafora:  Boolean(p.tiene_metafora),
          nota_maestro:    str(p.nota_maestro ?? ""),
          haiku_corregido: (() => {
            const h = p.haiku_corregido;
            if (!h) return null;
            if (typeof h === "string") return h;
            if (typeof h === "object") {
              // Intenta campos comunes con el texto completo
              if (h.texto)  return str(h.texto);
              if (h.haiku)  return str(h.haiku);
              if (h.result) return str(h.result);
              // Si tiene verso1/verso2/verso3 los une
              if (h.verso1 || h.verso2 || h.verso3)
                return [h.verso1, h.verso2, h.verso3].filter(Boolean).map(str).join("\n");
              // Si tiene v1/v2/v3
              if (h.v1 || h.v2 || h.v3)
                return [h.v1, h.v2, h.v3].filter(Boolean).map(str).join("\n");
            }
            return null;
          })(),
        };
      };
      setResultado(normaliza(parsed));
    }catch(e){setError(`Error: ${e.message}`);}
    finally{setCargando(false);}
  };

  const sc=p=>p>=8?"#5a7a2e":p>=5?"#8a6820":"#8a2e2e";
  const sb=p=>p>=8?"#eef5e4":p>=5?"#fdf5e0":"#fae8e8";
  const c=sky;
  const tr="background 8s ease, color 8s ease, border-color 8s ease";

  return(
    <div style={{minHeight:"100vh",background:c.bg,color:c.text,fontFamily:"'Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",transition:tr}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Noto+Serif:ital@0;1&display=swap');
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0}
        textarea{font-family:'IM Fell English','Palatino Linotype',Georgia,serif!important;transition:background 8s,color 8s}
        textarea::placeholder{color:#b0a488;font-style:italic}
        textarea:focus{outline:none}
        .ej-btn{transition:all .15s,background 8s,border-color 8s,color 8s}
        .ej-btn:hover{opacity:.75}
        .an-btn{transition:background .15s}
        .an-btn:disabled{opacity:.45;cursor:default}
      `}</style>

      <SkyCanvas skyRef={skyRef}/>
      <PetalCanvas mousePos={mousePos} mainRect={mainRect} skyRef={skyRef}/>

      <header style={{position:"relative",zIndex:1,width:"100%",borderBottom:`1px solid ${c.border}`,padding:"48px 24px 36px",textAlign:"center",transition:tr}}>
        <p style={{fontFamily:"'IM Fell English',Georgia,serif",fontSize:"11px",letterSpacing:"0.35em",textTransform:"uppercase",color:c.subtle,marginBottom:"18px"}}>Arte poético japonés</p>
        <div style={{fontSize:"54px",color:c.kanji,lineHeight:1,marginBottom:"16px",fontFamily:"'Noto Serif',Georgia,serif",opacity:.7,transition:tr}}>俳</div>
        <h1 style={{fontFamily:"'IM Fell English',Georgia,serif",fontSize:"clamp(28px,6vw,46px)",fontWeight:"normal",textTransform:"uppercase",color:c.text,lineHeight:1.15,marginBottom:"14px",letterSpacing:"0.04em",transition:tr}}>El Maestro<br/>del Haiku</h1>
        <p style={{fontSize:"12px",color:c.subtle,letterSpacing:"0.2em",fontFamily:"'IM Fell English',Georgia,serif"}}>Análisis según las reglas clásicas · Versos en español</p>
      </header>

      <main ref={mainRef} style={{position:"relative",zIndex:1,width:"100%",maxWidth:"620px",padding:"40px 24px 60px"}}>

        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px",justifyContent:"center"}}>
          {ejemplos.map(ej=>(
            <button key={ej.label} className="ej-btn"
              onClick={()=>{setTexto(ej.texto);setResultado(null);setError("");}}
              style={{background:"transparent",border:`1px solid ${c.border}`,color:c.subtle,borderRadius:"3px",padding:"6px 14px",fontSize:"11px",cursor:"pointer",letterSpacing:"0.12em",fontFamily:"'IM Fell English',Georgia,serif"}}>
              {ej.label}
            </button>
          ))}
        </div>

        <div style={{border:`1px solid ${c.border}`,borderRadius:"4px",background:c.paper,padding:"4px",marginBottom:"16px",boxShadow:"inset 0 1px 4px rgba(0,0,0,0.06)",transition:tr}}>
          <textarea value={texto} onChange={e=>setTexto(e.target.value)}
            placeholder={"Escribe tu haiku aquí...\nUn verso por línea (5 – 7 – 5 sílabas)"}
            rows={4} style={{width:"100%",background:"transparent",border:"none",color:c.text,fontSize:"20px",lineHeight:"2.1",padding:"14px 18px",resize:"vertical",minHeight:"120px"}}/>
        </div>

        <div style={{textAlign:"center",marginBottom:"10px"}}>
          <button className="an-btn" onClick={analizar} disabled={cargando||!texto.trim()}
            style={{background:c.text,border:`1px solid ${c.text}`,color:c.bg,borderRadius:"3px",padding:"13px 36px",fontSize:"12px",letterSpacing:"0.28em",cursor:"pointer",textTransform:"uppercase",fontFamily:"'IM Fell English',Georgia,serif",minWidth:"240px"}}>
            {cargando?`${FRASES_CARGA[fraseCarga]}${"·".repeat(puntos)}`:"❧ Analizar haiku ❧"}
          </button>
        </div>

        {cargando&&(
          <div style={{textAlign:"center",padding:"24px 0",animation:"fadeIn .3s ease"}}>
            <div style={{position:"relative",width:"48px",height:"48px",margin:"0 auto 14px"}}>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${c.border}`}}/>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid transparent`,borderTopColor:c.subtle,animation:"spin 1.2s linear infinite",willChange:"transform"}}/>
              <div style={{position:"absolute",inset:"12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",color:c.kanji,animation:"pulse 2s ease-in-out infinite"}}>俳</div>
            </div>
            <p style={{fontStyle:"italic",color:c.subtle,fontSize:"13px",fontFamily:"'IM Fell English',Georgia,serif",letterSpacing:"0.1em"}}>El maestro medita…</p>
          </div>
        )}

        {error&&<div style={{border:"1px solid #c88888",borderRadius:"4px",background:"#fae8e8",padding:"14px 18px",color:"#7a2020",fontSize:"13px",marginTop:"16px"}}>{error}</div>}

        {resultado&&!cargando&&(
          <div style={{animation:"fadeIn .5s ease",marginTop:"32px"}}>

            <Orn border={c.border} subtle={c.subtle}/>

            <div style={{textAlign:"center",marginBottom:"28px"}}>
              <p style={{fontSize:"10px",letterSpacing:"0.35em",textTransform:"uppercase",color:c.subtle,marginBottom:"10px",fontFamily:"'IM Fell English',Georgia,serif"}}>Puntuación</p>
              <div style={{display:"inline-flex",alignItems:"baseline",gap:"4px",background:sb(resultado.puntuacion),border:`1px solid ${sc(resultado.puntuacion)}44`,borderRadius:"6px",padding:"10px 28px"}}>
                <span style={{fontSize:"48px",lineHeight:1,color:sc(resultado.puntuacion),fontFamily:"'IM Fell English',Georgia,serif"}}>{resultado.puntuacion}</span>
                <span style={{fontSize:"18px",color:c.subtle}}>/10</span>
              </div>
            </div>

            <div style={{display:"flex",flexWrap:"wrap",gap:"6px",justifyContent:"center",marginBottom:"28px"}}>
              {[[!resultado.tiene_yo,resultado.tiene_yo?"✗ Hay «yo»":"✓ Sin «yo»"],[resultado.tiene_kigo,resultado.tiene_kigo?"✓ Kigo presente":"✗ Sin kigo"],[!resultado.tiene_rima,resultado.tiene_rima?"✗ Hay rima":"✓ Sin rima"],[!resultado.tiene_metafora,resultado.tiene_metafora?"✗ Metáfora":"✓ Sin metáfora"]].map(([ok,label],i)=>(
                <span key={i} style={{padding:"4px 13px",border:`1px solid ${ok?"#8a9a60":"#b06060"}`,color:ok?"#4a6a20":"#803030",background:ok?"#eef5e4":"#fae8e8",borderRadius:"3px",fontSize:"11px",letterSpacing:"0.1em",fontFamily:"'IM Fell English',Georgia,serif"}}>{label}</span>
              ))}
            </div>

            <section style={{marginBottom:"24px"}}>
              <p style={{fontSize:"10px",letterSpacing:"0.35em",textTransform:"uppercase",color:c.subtle,marginBottom:"14px",fontFamily:"'IM Fell English',Georgia,serif"}}>Análisis silábico</p>
              {resultado.versos?.map((v,i)=>(
                <div key={i} style={{borderLeft:`3px solid ${v.correcto?"#8a9a60":"#b06060"}`,paddingLeft:"16px",marginBottom:"14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                    <span style={{fontStyle:"italic",color:c.text,fontSize:"17px",fontFamily:"'IM Fell English',Georgia,serif"}}>{v.verso}</span>
                    <span style={{fontFamily:"monospace",fontSize:"13px",color:v.correcto?"#4a6a20":"#803030",marginLeft:"16px",whiteSpace:"nowrap",alignSelf:"center"}}>{v.silabas_contadas}/{v.silabas_esperadas}</span>
                  </div>
                  <p style={{fontSize:"11px",color:c.subtle,letterSpacing:"0.06em"}}>{v.desglose}</p>
                </div>
              ))}
            </section>

            {resultado.aciertos?.length>0&&(
              <section style={{marginBottom:"20px"}}>
                <p style={{fontSize:"10px",letterSpacing:"0.35em",textTransform:"uppercase",color:c.subtle,marginBottom:"10px",fontFamily:"'IM Fell English',Georgia,serif"}}>Aciertos</p>
                {resultado.aciertos.map((a,i)=><p key={i} style={{color:"#4a6a20",fontSize:"14px",marginBottom:"6px",lineHeight:1.6}}>✓ {a}</p>)}
              </section>
            )}

            {resultado.errores?.length>0&&(
              <section style={{marginBottom:"24px"}}>
                <p style={{fontSize:"10px",letterSpacing:"0.35em",textTransform:"uppercase",color:c.subtle,marginBottom:"10px",fontFamily:"'IM Fell English',Georgia,serif"}}>Errores</p>
                {resultado.errores.map((e,i)=><p key={i} style={{color:"#803030",fontSize:"14px",marginBottom:"6px",lineHeight:1.6}}>✗ {e}</p>)}
              </section>
            )}

            {resultado.nota_maestro&&(
              <blockquote style={{borderTop:`1px solid ${c.border}`,borderBottom:`1px solid ${c.border}`,padding:"20px 24px",margin:"24px 0",textAlign:"center"}}>
                <p style={{fontStyle:"italic",color:c.text,fontSize:"16px",lineHeight:"1.85",fontFamily:"'IM Fell English',Georgia,serif"}}>{resultado.nota_maestro}</p>
                <footer style={{marginTop:"12px",fontSize:"11px",letterSpacing:"0.25em",color:c.subtle,textTransform:"uppercase"}}>— El Maestro</footer>
              </blockquote>
            )}

            {resultado.haiku_corregido&&(
              <section style={{background:c.paper,border:`1px solid ${c.border}`,borderRadius:"4px",padding:"28px",textAlign:"center",transition:tr}}>
                <p style={{fontSize:"10px",letterSpacing:"0.35em",textTransform:"uppercase",color:c.subtle,marginBottom:"20px",fontFamily:"'IM Fell English',Georgia,serif"}}>Versión sugerida</p>
                <p style={{fontFamily:"'IM Fell English',Georgia,serif",fontStyle:"italic",fontSize:"20px",lineHeight:"2.2",color:c.text,whiteSpace:"pre-line"}}>{resultado.haiku_corregido}</p>
              </section>
            )}

          </div>
        )}
      </main>

      <footer style={{position:"relative",zIndex:1,borderTop:`1px solid ${c.border}`,width:"100%",padding:"20px 24px",textAlign:"center",color:c.subtle,fontSize:"11px",letterSpacing:"0.12em",fontFamily:"'IM Fell English',Georgia,serif",lineHeight:"2",transition:tr}}>
        <span>Idea original: <a href="https://www.gestoriavictoria.com" target="_blank" rel="noopener noreferrer" style={{color:c.subtle,textDecoration:"underline",textUnderlineOffset:"3px"}}>Gestoría Victoria SLPU</a></span>
        <span style={{margin:"0 10px",opacity:.5}}>·</span>
        <span>Desarrollo: <a href="https://www.lapiscifactoria.es" target="_blank" rel="noopener noreferrer" style={{color:c.subtle,textDecoration:"underline",textUnderlineOffset:"3px"}}>La Piscifactoría</a></span>
        <span style={{margin:"0 10px",opacity:.5}}>·</span>
        <span>Uso no comercial</span>
      </footer>
    </div>
  );
}