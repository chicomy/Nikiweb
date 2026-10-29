import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { FontLoader } from './vendor/FontLoader.js';
import { TextGeometry } from './vendor/TextGeometry.js';

/** A tiny, handcrafted city. All meshes and lettering are rendered locally. */
export async function createCity({ container, onSelect = () => {}, onHover = () => {}, onReady = () => {} }) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.setClearColor(0xf6f5ef, 0);
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D city of Niki’s experiences. Drag to rotate; choose a building to explore.');
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none;';
  container.appendChild(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-19, 19, 14, -14, 0.1, 150);
  const world = new THREE.Group(); scene.add(world);
  const cameraLook = new THREE.Vector3(0, 1.1, 0);
  const groups = new Map();
  const clickable = [];
  const mats = new Map();
  const geos = new Map();
  const decorations = [];
  let disposed = false, paused = false, selected = null, hoverId = null;
  let yaw = 0.62, targetYaw = 0.62, pitch = 0.72, targetPitch = 0.72;
  let magnification = 1, targetZoom = 1, frame = 0, start = performance.now();

  const P = {
    cream: '#fffbec', paper: '#f4efdd', grass: '#bbce9a', dark: '#355250',
    green: '#4e8467', leaf: '#8eb466', mint: '#b5d5c0', glass: '#8ebfc1',
    coral: '#df8871', orange: '#f2aa70', yellow: '#edca78', lilac: '#b5adc9',
    road: '#8b9690', line: '#f9f3df', stone: '#d9d2bf', pink: '#e9b2a2', blue: '#9bb9c1'
  };
  function material(color, opts = {}) {
    const key = color + JSON.stringify(opts);
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts }));
    return mats.get(key);
  }
  function mesh(geometry, color, parent, x=0, y=0, z=0, opts={}) {
    const item = new THREE.Mesh(geometry, typeof color === 'string' ? material(color, opts) : color);
    item.position.set(x, y, z); item.castShadow = true; item.receiveShadow = true;
    parent.add(item); return item;
  }
  function box(parent, w,h,d, color, x=0,y=0,z=0,r=0.1) {
    r = Math.min(r,w/2.1,h/2.1,d/2.1);
    const key = `${w},${h},${d},${r}`;
    if (!geos.has(key)) geos.set(key, new RoundedBoxGeometry(w,h,d,2,r));
    return mesh(geos.get(key),color,parent,x,y,z);
  }
  function cylinder(parent, rt, rb, h, color, x=0,y=0,z=0,segments=24) {
    return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),color,parent,x,y,z);
  }
  function ball(parent, r,color,x=0,y=0,z=0) {
    return mesh(new THREE.SphereGeometry(r,12,10),color,parent,x,y,z);
  }
  function group(parent, x=0,y=0,z=0) { const g = new THREE.Group(); g.position.set(x,y,z); parent.add(g); return g; }
  function sign(parent, text, w, h, x,y,z, bg=P.cream, fg=P.dark, rotation=0) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024*h/w);
    const ctx = canvas.getContext('2d'); ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=fg; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=`700 ${Math.min(canvas.height*.47, 1024/(text.length*.64))}px Arial, sans-serif`;
    ctx.fillText(text,512,canvas.height*.54);
    const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));
    plane.position.set(x,y,z); plane.rotation.y=rotation; parent.add(plane); return plane;
  }
  function windows(parent,w,h,d,rows=2,cols=4, glass=P.glass, startY=.8) {
    const spacing=w/(cols+.7);
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++) {
      const x=(col-(cols-1)/2)*spacing;
      box(parent,spacing*.61,.43,.055,glass,x,startY+row*.72,d/2+.035,.045);
    }
    for(let row=0;row<rows;row++) for(let col=0;col<3;col++) {
      box(parent,.055,.43,.5,glass,w/2+.035,startY+row*.72,(col-1)*d/3.5,.04);
    }
  }
  function tree(parent,x,z,scale=1) {
    const t=group(parent,x,.37,z); t.scale.setScalar(scale);
    cylinder(t,.10,.14,1.0,'#9d8d64',0,.55,0,8);
    ball(t,.57,P.leaf,0,1.34,0); ball(t,.43,P.green,-.27,1.23,.17); ball(t,.37,'#a8c27d',.23,1.51,.02);
    return t;
  }
  function shrub(parent,x,z,scale=1) { const b=ball(parent,.37,P.leaf,x,.67,z); b.scale.set(scale,.72,scale); }
  function lamp(parent,x,z) {
    cylinder(parent,.04,.06,1.4,P.dark,x,1.04,z,8);
    ball(parent,.13,P.cream,x,1.76,z);
    cylinder(parent,.23,.23,.06,P.dark,x,1.89,z,12);
  }
  function bench(parent,x,z,rotation=0) {
    const g=group(parent,x,.5,z); g.rotation.y=rotation;
    box(g,1.05,.09,.35,'#bd936a',0,.18,0,.04);
    box(g,1.05,.32,.07,'#bd936a',0,.41,-.15,.04);
    for(const x of [-.36,.36]) box(g,.07,.3,.26,P.dark,x,0,0,.03);
  }
  function building(id,x,z) {
    const g=group(world,x,.37,z); g.userData.id=id; groups.set(id,g); clickable.push(g);
    box(g,6.0,.14,4.8,P.paper,0,.025,0,.28);
    return g;
  }

  scene.add(new THREE.HemisphereLight('#fff8df','#c6d3bd',2.3));
  const sun=new THREE.DirectionalLight('#fff1d8',3.5); sun.position.set(-14,25,15); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:.1,far:80});
  sun.shadow.bias=-.0005; sun.shadow.normalBias=.045; sun.shadow.radius=4; scene.add(sun);
  const fill=new THREE.DirectionalLight('#d6ebff',1.1); fill.position.set(15,12,-12); scene.add(fill);

  // The rounded, layered model base and continuous perimeter road.
  box(world,25,.66,20.8,'#d7cdb3',0,-.38,0,.55);
  box(world,24.9,.25,20.7,'#ebe3cd',0,-.02,0,.5);
  box(world,24.5,.18,20.3,P.grass,0,.16,0,.5);
  box(world,23.6,.08,19.4,P.road,0,.29,0,.62);
  box(world,20.1,.10,15.9,P.grass,0,.34,0,.62);
  // Quiet lane markings, crosswalks, sidewalks.
  for(let i=-9;i<=9;i+=2) {
    box(world,.64,.012,.055,P.line,i,.338,8.78,.015);
    box(world,.64,.012,.055,P.line,i,.338,-8.78,.015);
  }
  for(let i=-7;i<=7;i+=2) {
    box(world,.055,.012,.64,P.line,10.92,.338,i,.015);
    box(world,.055,.012,.64,P.line,-10.92,.338,i,.015);
  }
  for(let i=0;i<6;i++) {
    box(world,.15,.015,1.35,P.line,-.7+i*.28,.343,8.78,.01);
    box(world,1.35,.015,.15,P.line,-10.92,.343,-.7+i*.28,.01);
  }
  box(world,19.6,.05,2.0,P.paper,0,.40,.15,.25);
  box(world,1.15,.05,15.9,P.paper,-3.55,.40,0,.2);
  box(world,1.15,.05,15.9,P.paper,3.55,.40,0,.2);

  // 01 — a coral archive and documentary cinema, with a rooftop camera.
  const archive=building('city',-6.7,-4.45);
  box(archive,4.7,2.65,3.15,P.coral,-.15,1.4,-.25,.2);
  box(archive,5.05,.25,3.5,P.cream,-.15,2.85,-.25,.1);
  box(archive,5.0,.15,3.45,'#d5b9a0',-.15,.2,-.25,.1);
  windows(archive,4.7,2.6,3.15,2,5,'#d9e4cd',.73);
  box(archive,1.2,1.15,.12,P.dark,0,.7,1.39,.06);
  box(archive,4.55,.64,.17,P.cream,-.15,2.25,1.39,.05);
  sign(archive,'CITY ARCHIVE',4.1,.47,-.15,2.26,1.49);
  const movie=group(archive,0,3.24,-.35); movie.rotation.y=.1;
  box(movie,1.55,.8,.8,P.dark,0,.25,0,.15);
  const lens=cylinder(movie,.32,.44,.52,P.coral,.98,.24,0); lens.rotation.z=Math.PI/2;
  for(const x of [-.43,.43]) { const roll=cylinder(movie,.45,.45,.22,P.cream,x,.96,0); roll.rotation.x=Math.PI/2; for(let i=0;i<4;i++) ball(movie,.075,P.dark,x+Math.cos(i*Math.PI/2)*.24,.96+Math.sin(i*Math.PI/2)*.24,.13); }
  for(const x of [-.32,.32]) { const leg=box(movie,.08,.7,.08,P.dark,x,-.45,0,.02); leg.rotation.z=x; }
  tree(archive,-2.5,1.5,.75); shrub(archive,2.5,1.3,.8);

  // 02 — soft glass, white frames, a small observatory dish.
  const lab=building('lab',0,-5.25);
  box(lab,4.3,3.6,3.2,P.mint,0,1.9,-.2,.2);
  box(lab,4.6,.22,3.5,P.cream,0,3.8,-.2,.12);
  box(lab,4.6,.2,3.5,P.cream,0,.23,-.2,.09);
  for(const level of [.7,1.6,2.5]) {
    box(lab,4.37,.53,.07,'#9fc5c6',0,level+.1,1.44,.04);
    box(lab,.07,.53,3.2,'#9fc5c6',2.19,level+.1,-.2,.04);
  }
  for(const x of [-1.9,-.95,0,.95,1.9]) box(lab,.085,3.4,.1,P.cream,x,1.95,1.48,.02);
  box(lab,3.7,.52,.13,P.cream,0,3.15,1.49,.05);
  sign(lab,'FEEL TO READ',3.45,.36,0,3.16,1.57);
  const dish=group(lab,.6,4.3,-.2); dish.rotation.z=-.35;
  cylinder(dish,.12,.2,.7,P.dark,0,-.2,0,12);
  const bowl=mesh(new THREE.SphereGeometry(.75,24,16,0,Math.PI*2,0,Math.PI/2),P.cream,dish,0,.25,0); bowl.rotation.x=Math.PI;
  cylinder(dish,.035,.035,.8,P.coral,0,.6,0,8); ball(dish,.13,P.coral,0,1.01,0);
  box(lab,.9,.6,.9,P.mint,-1.25,4.12,-.8,.12);
  tree(lab,-2.6,1.55,.85); tree(lab,2.6,1.7,.65);

  // 03 — Eurus: a cheerful sustainable atelier with a candle and rooftop garden.
  const atelier=building('eurus',6.7,-4.45);
  box(atelier,4.6,2.5,3.15,P.yellow,0,1.32,-.25,.2);
  box(atelier,4.95,.22,3.5,P.cream,0,2.65,-.25,.11);
  windows(atelier,4.6,2.5,3.15,1,4,'#a2c0b2',.95);
  box(atelier,4.2,.5,.14,P.cream,0,2.05,1.38,.04);
  sign(atelier,'EURUS ATELIER',3.9,.35,0,2.07,1.46);
  for(let i=0;i<7;i++) box(atelier,.6,.1,.8,i%2?P.cream:P.yellow,-1.8+i*.6,1.63,1.8,.03);
  const candle=cylinder(atelier,.65,.67,1.3,P.pink,-.65,3.43,-.1,32);
  cylinder(atelier,.59,.59,.06,P.cream,-.65,4.1,-.1,32);
  cylinder(atelier,.022,.022,.22,P.dark,-.65,4.19,-.1,8);
  const flame=ball(atelier,.16,'#f4c975',-.65,4.38,-.1); flame.scale.set(.62,1.7,.62); decorations.push({type:'flame',mesh:flame,base:4.38});
  sign(atelier,'EURUS',.89,.4,-.65,3.5,.56,P.pink);
  for(const x of [.75,1.5]) { box(atelier,.5,.35,.6,'#b59476',x,2.99,-.55,.07); ball(atelier,.37,P.leaf,x,3.35,-.55); }
  shrub(atelier,-2.55,1.5,1.3); shrub(atelier,2.55,1.5,.9);

  // 04 — a community house, broad steps, a generous porch and a cheerful flag.
  const house=building('community',-6.7,4.65);
  box(house,4.7,2.35,3.05,P.pink,-.1,1.25,-.2,.18);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-2.65,0); roofShape.lineTo(0,1.35); roofShape.lineTo(2.65,0); roofShape.closePath();
  const roof=mesh(new THREE.ExtrudeGeometry(roofShape,{depth:3.55,bevelEnabled:true,bevelThickness:.09,bevelSize:.07,bevelSegments:2,steps:1}),P.coral,house,-.1,2.35,-1.95);
  box(house,1.1,1.45,.12,P.dark,-.1,.9,1.4,.06);
  for(const x of [-1.55,1.35]) { box(house,.78,.85,.07,P.cream,x,1.36,1.37,.08); box(house,.61,.69,.05,P.glass,x,1.36,1.42,.06); }
  box(house,3.8,.13,1.1,P.cream,-.1,2.06,1.72,.06);
  for(const x of [-1.65,1.45]) cylinder(house,.08,.08,1.85,P.cream,x,1.08,2.01,12);
  for(let i=0;i<3;i++) box(house,2.5+i*.35,.14,.4,P.stone,-.1,.24-i*.055,2.15+i*.19,.05);
  sign(house,'COMMUNITY',3.4,.45,-.1,2.56,1.66,P.coral,P.cream);
  cylinder(house,.035,.035,2.6,P.dark,2.45,1.5,.75,8);
  box(house,.7,.46,.035,P.yellow,2.8,2.48,.75,.015);
  tree(house,-2.6,1.5,.8); bench(house,1.85,-1.8);

  // 05 — the sports club stays low so the NIKI monument remains visible.
  const sports=building('sports',0,5.1);
  box(sports,2.35,1.6,2.25,P.mint,-1.4,.9,-.65,.2);
  box(sports,2.65,.24,2.55,P.cream,-1.4,1.8,-.65,.13);
  sign(sports,'SPORTS CLUB',2.15,.39,-1.4,1.36,.5,P.mint);
  box(sports,1.6,.55,.05,P.glass,-1.4,.73,.51,.04);
  const green=box(sports,2.7,.13,3.65,'#83aa73',1.3,.22,.02,.7); green.rotation.y=-.08;
  const bunker=box(sports,.95,.04,1.2,'#e7d7ac',1.94,.3,.9,.4); bunker.rotation.y=.3;
  cylinder(sports,.11,.11,.02,P.dark,1.1,.31,-.65,20);
  cylinder(sports,.025,.025,1.75,P.cream,1.1,1.16,-.65,8);
  const flag=mesh(new THREE.PlaneGeometry(.62,.4),material(P.coral,{side:THREE.DoubleSide}),sports,1.4,1.87,-.65);
  ball(sports,.07,P.cream,.5,.4,.55);
  ball(sports,.28,'#b57e50',-1.9,.43,1.4); ball(sports,.25,P.cream,-1.15,.42,1.4);
  tree(sports,-2.8,1.7,.64); shrub(sports,2.5,-1.75,.7);

  // 06 — a lavender theatre with a lit marquee and oversized musical notes.
  const theatre=building('arts',6.7,4.65);
  box(theatre,4.5,2.45,3.0,P.lilac,0,1.33,-.25,.24);
  box(theatre,4.85,.28,3.3,P.cream,0,2.7,-.25,.16);
  box(theatre,3.9,.66,.25,P.dark,0,2.13,1.38,.07);
  sign(theatre,'THE PLAYHOUSE',3.5,.43,0,2.14,1.52,P.dark,P.cream);
  for(let i=0;i<9;i++) ball(theatre,.045,P.yellow,-1.72+i*.43,1.9,1.55);
  for(const x of [-1.2,0,1.2]) {
    box(theatre,.85,1.18,.12,P.cream,x,.88,1.31,.15);
    box(theatre,.68,1.0,.06,'#8a829e',x,.88,1.39,.13);
  }
  const note=group(theatre,0,3.3,-.3); note.rotation.y=-.25;
  for(const x of [-.58,.58]) { const head=ball(note,.32,P.dark,x,.05,0); head.scale.set(1,.65,.65); box(note,.10,1.4,.12,P.dark,x+.24,.72,0,.04); }
  const beam=box(note,1.25,.22,.12,P.dark,.23,1.35,0,.045); beam.rotation.z=.12;
  tree(theatre,2.55,1.55,.75); shrub(theatre,-2.5,1.55,1.1);

  // A little town square with the name as real, beveled architecture.
  box(world,8.3,.3,2.65,P.cream,0,.53,.1,.3);
  box(world,8.65,.08,2.95,'#d7cbb2',0,.39,.1,.32);
  try {
    const json=await fetch(new URL('./vendor/helvetiker_bold.typeface.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('font');return r.json();});
    const font=new FontLoader().parse(json);
    const name=group(world,0,.69,.78);
    const palette=[P.coral,P.yellow,P.green,P.blue]; let total=0;
    for(const [i,letter] of [...'NIKI'].entries()) {
      const geo=new TextGeometry(letter,{font,size:1.92,depth:.7,curveSegments:5,bevelEnabled:true,bevelThickness:.075,bevelSize:.055,bevelSegments:3});
      geo.computeBoundingBox(); const width=geo.boundingBox.max.x-geo.boundingBox.min.x;
      const m=mesh(geo,palette[i],name,total,0,0); m.position.x-=geo.boundingBox.min.x;
      total+=width+.17;
    }
    name.position.x=-total/2;
    name.rotation.y=.12;
  } catch(error) { sign(world,'NIKI',6.5,1.7,0,1.55,1.02); }
  for(const x of [-4.5,4.5]) { lamp(world,x,.25); shrub(world,x,-.45,.65); }

  // Landscape and tiny street furniture bring the miniature to life.
  const treeLocations=[[-9,-6.9],[-9,-2.0],[-9,1.9],[-9,6.8],[-4.5,-7.1],[4.6,-7.1],[9,-6.8],[9,-1.9],[9,1.9],[9,6.7],[-4.4,7.05],[4.5,7.05]];
  treeLocations.forEach(([x,z],i)=>tree(world,x,z,.7+(i%3)*.13));
  for(const [x,z] of [[-9.2,-.3],[9.2,.3],[-2.6,7.1],[2.6,-7.1]]) lamp(world,x,z);
  bench(world,-4.8,.3,-Math.PI/2); bench(world,4.8,.3,Math.PI/2);
  for(let i=0;i<4;i++) { box(world,.21,.22,.21,P.coral,-2.6+i*.35,.5,-1.5,.08); ball(world,.13,'#b9c694',-2.6+i*.35,.74,-1.5); }
  // Bright toy cars follow the four rounded corners of the ring road.
  function makeCar(color) {
    const car=group(world); box(car,.72,.3,1.35,color,0,.27,0,.13); box(car,.61,.28,.65,P.cream,0,.5,-.1,.12);
    box(car,.5,.18,.035,P.glass,0,.51,.24,.03);
    for(const x of [-.35,.35]) for(const z of [-.42,.42]) { const wheel=cylinder(car,.14,.14,.10,P.dark,x,.18,z,12); wheel.rotation.z=Math.PI/2; }
    box(car,.45,.08,.04,P.yellow,0,.26,.69,.02); car.position.y=.32; return car;
  }
  const cars=[{mesh:makeCar(P.coral),offset:0},{mesh:makeCar(P.yellow),offset:.43},{mesh:makeCar('#86b5bd'),offset:.72}];
  const roadCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9.3,0,8.75),new THREE.Vector3(9.3,0,8.75),new THREE.Vector3(10.9,0,7.2),new THREE.Vector3(10.9,0,-7.2),
    new THREE.Vector3(9.3,0,-8.75),new THREE.Vector3(-9.3,0,-8.75),new THREE.Vector3(-10.9,0,-7.2),new THREE.Vector3(-10.9,0,7.2)
  ],true,'catmullrom',.15);

  // Soft, translucent contact shadow below the floating island.
  const shadowCanvas=document.createElement('canvas'); shadowCanvas.width=256; shadowCanvas.height=256;
  const sctx=shadowCanvas.getContext('2d'); const gradient=sctx.createRadialGradient(128,128,25,128,128,120);
  gradient.addColorStop(0,'rgba(59,70,51,.25)'); gradient.addColorStop(.65,'rgba(59,70,51,.13)'); gradient.addColorStop(1,'rgba(59,70,51,0)');
  sctx.fillStyle=gradient; sctx.fillRect(0,0,256,256);
  const groundShadow=new THREE.Mesh(new THREE.PlaneGeometry(38,31),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  groundShadow.rotation.x=-Math.PI/2; groundShadow.position.y=-1.15; scene.add(groundShadow);

  function resize() {
    const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight),aspect=w/h;
    renderer.setSize(w,h,false);
    const halfHeight=Math.max(13.3,17.4/aspect);
    camera.left=-halfHeight*aspect; camera.right=halfHeight*aspect; camera.top=halfHeight; camera.bottom=-halfHeight;
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize); observer.observe(container); resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function hit(e) {
    const r=renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(pointer,camera); const hits=raycaster.intersectObjects(clickable,true);
    if(!hits.length)return null;
    let obj=hits[0].object; while(obj&&!obj.userData.id)obj=obj.parent; return obj?.userData.id || null;
  }
  let drag=null;
  function pointerDown(e) { if(e.button!==0)return; drag={x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY,moved:false}; renderer.domElement.setPointerCapture(e.pointerId); }
  function pointerMove(e) {
    if(drag) {
      if(Math.hypot(e.clientX-drag.ox,e.clientY-drag.oy)>6)drag.moved=true;
      if(drag.moved) { targetYaw-=(e.clientX-drag.x)*.006; targetPitch=THREE.MathUtils.clamp(targetPitch+(e.clientY-drag.y)*.003,.45,1.0); }
      drag.x=e.clientX; drag.y=e.clientY;
      renderer.domElement.style.cursor=drag.moved?'grabbing':'pointer'; return;
    }
    const id=hit(e); if(id!==hoverId){hoverId=id;onHover(id);}
    renderer.domElement.style.cursor=id?'pointer':'grab';
  }
  function pointerUp(e) { if(drag&&!drag.moved) {const id=hit(e);if(id)onSelect(id);} drag=null; renderer.domElement.style.cursor='grab'; }
  function pointerLeave() { if(!drag){hoverId=null;onHover(null);} }
  function pointerCancel() {drag=null;hoverId=null;onHover(null);}
  renderer.domElement.addEventListener('pointerdown',pointerDown);
  renderer.domElement.addEventListener('pointermove',pointerMove);
  renderer.domElement.addEventListener('pointerup',pointerUp);
  renderer.domElement.addEventListener('pointerleave',pointerLeave);
  renderer.domElement.addEventListener('pointercancel',pointerCancel);

  function easeOutCubic(x){return 1-Math.pow(1-x,3);}
  let elapsed=0,last=performance.now();
  const ordered=[...groups.values()];
  function animate(now) {
    if(disposed)return; frame=requestAnimationFrame(animate);
    // The first RAF timestamp can precede performance.now() from setup.
    // Keep time monotonic and clamp tab-resume gaps before sampling the curve.
    const dt=THREE.MathUtils.clamp((now-last)/1000,0,.05);last=now;if(!paused)elapsed+=dt;
    const intro=reducedMotion?1:THREE.MathUtils.clamp((now-start)/2400,0,1);
    yaw+=(targetYaw-yaw)*.08; pitch+=(targetPitch-pitch)*.08; magnification+=(targetZoom-magnification)*.08;
    const angle=yaw+(1-easeOutCubic(intro))*.52;
    const distance=42;
    camera.position.set(Math.sin(angle)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(angle)*Math.cos(pitch)*distance);
    camera.lookAt(cameraLook); camera.zoom=magnification*(.88+.12*easeOutCubic(intro));camera.updateProjectionMatrix();
    ordered.forEach((g,i)=>{
      const reveal=reducedMotion?1:THREE.MathUtils.clamp((now-start-180-i*125)/850,0,1);
      const s=reveal===1?1:1+2.1*Math.pow(reveal-1,3)+1.1*Math.pow(reveal-1,2);
      g.scale.setScalar(Math.max(.001,s));
      const lift=g.userData.id===(hoverId||selected)? .20:0;
      g.position.y+=(.37+lift-g.position.y)*.12;
    });
    cars.forEach(({mesh:car,offset})=>{
      const t=THREE.MathUtils.euclideanModulo(offset+(reducedMotion?0:elapsed*.012),1);
      const pos=roadCurve.getPointAt(t),tan=roadCurve.getTangentAt(t);
      car.position.set(pos.x,.34,pos.z);car.rotation.y=Math.atan2(tan.x,tan.z);
    });
    if(!paused&&!reducedMotion)decorations.forEach(d=>{if(d.type==='flame')d.mesh.scale.y=1.7+Math.sin(elapsed*4)*.12;});
    renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(animate); onReady();
  return {
    reset(){targetYaw=.62;targetPitch=.72;targetZoom=1;selected=null;start=performance.now();},
    focus(id){selected=groups.has(id)?id:null;},
    setPaused(value){paused=!!value;},
    zoom(delta){targetZoom=THREE.MathUtils.clamp(targetZoom+delta,.75,1.6);},
    dispose(){
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);
      renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointerleave',pointerLeave);renderer.domElement.removeEventListener('pointercancel',pointerCancel);
      const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();
    }
  };
}
