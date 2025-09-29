/* ===== Light style p5 network (no CSS color parsing) ===== */
const COLORS = {
  overlap:"#0f8fff",
  method:"#00b894",
  tension:"#f4a100",
  gap:"#e56de1",
  coreA:"#2ea8ff", coreB:"#36d6b4", coreC:"#d96cff", coreD:"#ffa928",
  citeBlue:"#6aa3ff", citeMint:"#56ead6", citePink:"#ff9eea"
};

const nodes = [
  { id:"Bach-y-Rita", label:"Bach-y-Rita\n(Sensory Substitution)", color:COLORS.coreA, type:"core",
    url:"https://doi.org/10.1152/jappl.1969.26.1.127",
    note:"Touch can carry visual info; the brain adapts with training.\nImplication: keep the haptic vocabulary small and learnable."},
  { id:"LLM-Glasses", label:"LLM-Glasses\n(GenAI + Haptics)", color:COLORS.coreB, type:"core",
    url:"https://arxiv.org/abs/2503.16475",
    note:"Camera/LLM pipeline with temple haptics; cue recognition and path trials.\nLimitation: ~1.25s pattern → responsiveness risk."},
  { id:"DataFeminism", label:"Data Feminism\n(Data Justice)", color:COLORS.coreC, type:"core",
    url:"https://datafeminism.mitpress.mit.edu/",
    note:"Whose knowledge counts? Pair numbers with stories; design consent & uncertainty."},
  { id:"MissingVoice", label:"Missing Voice\n(O&M Practice)", color:COLORS.coreD, type:"core",
    url:"https://en.wikipedia.org/wiki/Orientation_and_mobility",
    note:"Orientation & Mobility teaching methods; street drills; transfer & safety."},

  { id:"Merzenich", label:"Merzenich\n(Neuroplasticity)", color:COLORS.citeBlue, type:"cite",
    url:"https://doi.org/10.1146/annurev.neuro.25.112701.142843", note:"Cortical remapping supports substitution."},
  { id:"TVSS", label:"TVSS & Tactile Arrays", color:COLORS.citeBlue, type:"cite",
    url:"https://link.springer.com/article/10.3758/BF03205880", note:"Early tactile vision substitution systems."},

  { id:"YOLO-World", label:"YOLO-World\n(Detection)", color:COLORS.citeMint, type:"cite",
    url:"https://arxiv.org/abs/2401.17270", note:"Open-vocabulary detection backbone."},
  { id:"GPT-4o", label:"GPT-4o\n(Multimodal LLM)", color:COLORS.citeMint, type:"cite",
    url:"https://openai.com/index/hello-gpt-4o/", note:"Multimodal reasoning for guidance."},
  { id:"dotLumen", label:"dotLumen\n(Smart Glasses)", color:COLORS.citeMint, type:"cite",
    url:"https://www.dotlumen.com/", note:"Industry attempt: cameras + haptics."},

  { id:"Haraway", label:"Haraway\n(Situated Knowledges)", color:COLORS.citePink, type:"cite",
    url:"https://doi.org/10.2307/3178066", note:"Knowledge is partial, situated."},
  { id:"CounterMap", label:"Counter-Mapping", color:COLORS.citePink, type:"cite",
    url:"https://www.tandfonline.com/doi/abs/10.1080/09654313.2016.1244514", note:"Recover invisibilities via mapping."},
  { id:"Hamraie", label:"Hamraie\n(Disability Justice)", color:COLORS.citePink, type:"cite",
    url:"https://mitpress.mit.edu/9780262037921/building-access/", note:"Access as political design."}
];

const edges = [
  {a:"Bach-y-Rita", b:"LLM-Glasses", kind:"method", note:"Lab codes → wearable cues: test small vs large vocabularies."},
  {a:"Bach-y-Rita", b:"DataFeminism", kind:"overlap", note:"Embodiment × situated knowledge."},
  {a:"LLM-Glasses", b:"DataFeminism", kind:"tension", note:"Camera-first vs privacy/consent."},

  {a:"Bach-y-Rita", b:"MissingVoice", kind:"gap", note:"Lack of long outdoor trials."},
  {a:"LLM-Glasses", b:"MissingVoice", kind:"gap", note:"Latency & safety need street tests."},
  {a:"DataFeminism", b:"MissingVoice", kind:"gap", note:"Small-N privacy tooling is thin."},

  {a:"Merzenich", b:"Bach-y-Rita", kind:"method", note:"Neuroplasticity evidence."},
  {a:"TVSS", b:"Bach-y-Rita", kind:"method", note:"Historical tactile arrays."},
  {a:"YOLO-World", b:"LLM-Glasses", kind:"method", note:"Detection backbone."},
  {a:"GPT-4o", b:"LLM-Glasses", kind:"method", note:"Multimodal reasoning."},
  {a:"dotLumen", b:"LLM-Glasses", kind:"overlap", note:"Similar ambition; different privacy stance."},
  {a:"Haraway", b:"DataFeminism", kind:"method", note:"Situated knowledges."},
  {a:"CounterMap", b:"DataFeminism", kind:"method", note:"Counter-mapping practice."},
  {a:"Hamraie", b:"DataFeminism", kind:"overlap", note:"Disability justice in the built environment."}
];

/* ===== Force layout + drawing ===== */
let picked=null, hover=null, showGaps=true;

function setup(){
  const wrap=document.getElementById('canvas-wrap');
  createCanvas(wrap.clientWidth, wrap.clientHeight).parent('canvas-wrap');
  textFont('Inter'); textSize(12);
  initLayout();
  showNote(
    "Click a node or edge","Hint",
    "Drag nodes. Click edges for overlaps, tensions, or gaps.\n⌘/Ctrl + click node = open link. Press “H” for help.",
    null
  );
}
function windowResized(){
  const wrap=document.getElementById('canvas-wrap'); resizeCanvas(wrap.clientWidth, wrap.clientHeight);
}

function initLayout(){
  const core = nodes.filter(n=>n.type==="core");
  const sat  = nodes.filter(n=>n.type==="cite");
  const R1 = Math.min(width,height)*0.28;
  const R2 = Math.min(width,height)*0.39;
  const cx = Math.min(width-420, width*0.46);
  const cy = height*0.54;

  core.forEach((n,i)=>{
    const t = (i/core.length)*TWO_PI;
    n.x = cx + R1*Math.cos(t); n.y = cy + R1*Math.sin(t);
    n.vx=0; n.vy=0; n.size=86;
  });
  sat.forEach((n,i)=>{
    const t = (i/sat.length)*TWO_PI + 0.2;
    n.x = cx + R2*Math.cos(t); n.y = cy + R2*Math.sin(t);
    n.vx=0; n.vy=0; n.size=64;
  });
}

function draw(){
  clear(); // white bg via CSS grid under canvas

  // repulsion
  for(let i=0;i<nodes.length;i++){
    for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i], b=nodes[j];
      const dx=a.x-b.x, dy=a.y-b.y, d=Math.max(0.1, Math.hypot(dx,dy));
      const f = 1500/(d*d); const ux=dx/d, uy=dy/d;
      a.vx += f*ux; a.vy += f*uy; b.vx -= f*ux; b.vy -= f*uy;
    }
  }
  // springs
  edges.forEach(e=>{
    if(!showGaps && e.kind==='gap') return;
    const a=getN(e.a), b=getN(e.b);
    const dx=b.x-a.x, dy=b.y-a.y, d=Math.max(1, Math.hypot(dx,dy));
    const target = (a.size+b.size)/2 + (isCite(a)||isCite(b)?130:170);
    const k = 0.014*(d-target); const ux=dx/d, uy=dy/d;
    a.vx += k*ux; a.vy += k*uy; b.vx -= k*ux; b.vy -= k*uy;
  });

  // integrate
  nodes.forEach(n=>{
    if(picked===n) return;
    n.vx*=0.9; n.vy*=0.9; n.x+=n.vx*0.5; n.y+=n.vy*0.5;
    n.x = constrain(n.x, 90, width-410); n.y = constrain(n.y, 80, height-60);
  });

  // edges (light colors)
  edges.forEach(e=>{
    if(!showGaps && e.kind==='gap') return;
    const a=getN(e.a), b=getN(e.b);
    const col=edgeColor(e.kind);
    const mx=(a.x+b.x)/2 + (a.y-b.y)*0.08; const my=(a.y+b.y)/2 + (b.x-a.x)*0.08;
    strokeWeight(3); stroke(col); noFill(); bezier(a.x,a.y, mx,my, mx,my, b.x,b.y);
    if(dist(mouseX,mouseY,mx,my)<12){
      hover={title:`${cap(e.kind)}: ${e.a} ↔ ${e.b}`, type:cap(e.kind), text:e.note, url:null, kind:'edge'};
      cursor('pointer');
    }
  });

  // nodes
  nodes.forEach(n=>{
    const r=n.size/2;
    noStroke(); fill(0,0,0,12); circle(n.x,n.y,n.size+16); /* soft shadow */
    stroke("#d7dde7"); strokeWeight(2); fill(n.color); circle(n.x,n.y,n.size);

    push(); translate(n.x,n.y); textAlign(CENTER,CENTER);
      fill(0,0,0,0.14); text(n.label,1.2,1.2, n.size-12, n.size-12);
      fill("#0d1522"); text(n.label,0,0, n.size-12, n.size-12);
    pop();

    if(dist(mouseX,mouseY,n.x,n.y)<r){
      hover={title:n.label.replace('\n',' — '), type:n.type==='cite'?'Citation':'Reading', text:n.note, url:n.url, kind:'node'};
      cursor('pointer');
    }
  });

  if(hover){ showNote(hover.title, cap(hover.type), hover.text, hover.url); }
  hover=null;
}

function mousePressed(){ picked = nearest(mouseX,mouseY, 48); }
function mouseDragged(){ if(picked){ picked.x=mouseX; picked.y=mouseY; } }
function mouseReleased(){ picked=null; }
function mouseClicked(){
  const n = nearest(mouseX,mouseY, 40);
  if(n && (keyIsDown(CONTROL)||keyIsDown(META)) && n.url){ window.open(n.url, "_blank", "noopener"); }
}
function keyPressed(){
  if(key==='H'||key==='h'){ showNote("Help","Shortcuts","Drag nodes · Click edges · ⌘/Ctrl+click node = open link · R reset · G toggle gaps", null); }
  else if(key==='R'||key==='r'){ initLayout(); }
  else if(key==='G'||key==='g'){ showGaps=!showGaps; }
}

/* ===== Helpers ===== */
function getN(id){ return nodes.find(n=>n.id===id); }
function isCite(n){ return n.type==='cite'; }
function nearest(x,y,rad){ let best=null,b=1e9; nodes.forEach(n=>{ const d=dist(x,y,n.x,n.y); if(d<rad && d<b){b=d;best=n;} }); return best; }
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function edgeColor(kind){ return ({overlap:COLORS.overlap, method:COLORS.method, tension:COLORS.tension, gap:COLORS.gap})[kind] || COLORS.overlap; }

function showNote(title,type,text,url){
  document.getElementById('noteTitle').textContent = title;
  document.getElementById('noteType').textContent = type;
  document.getElementById('note').textContent = text;
  document.getElementById('extLink').innerHTML = url ? `→ <a href="${url}" target="_blank" rel="noopener">Open link</a>` : "";
}
