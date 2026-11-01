import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { FontLoader } from './vendor/FontLoader.js';
import { TextGeometry } from './vendor/TextGeometry.js';
import { buildLandmarkModel } from './landmark-models.js';
import { buildMapGround } from './map-ground.js';
import { MAP } from './map-reference.js';
import { loadModelAssets,fitModelAsset,modelFitLimits } from './model-assets.js';
import { RoomEnvironment } from './vendor/environments/RoomEnvironment.js';
import { createIndustrialMotion } from './industrial-motion.js';
import { createSportsMotion } from './sports-motion.js';
import { containsPoint,footprintsOverlap } from './footprints.js';

export async function createWorld({container,places=[],onSelect=()=>{},onHover=()=>{},onMove=()=>{},onReady=()=>{}}){
  const DEFAULT_YAW=0,DEFAULT_PITCH=.78;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#dce7dc'); scene.fog=new THREE.Fog('#dce7dc',145,260);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  renderer.domElement.style.cssText='display:block;width:100%;height:100%;outline:none;touch-action:none';renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Explore Niki’s city. Drag to orbit, scroll to zoom, use WASD or arrow keys to walk, and E to enter a nearby landmark.');container.appendChild(renderer.domElement);
  const camera=new THREE.OrthographicCamera(-36,36,27,-27,.1,250);
  const world=new THREE.Group();scene.add(world);
  const P={cream:'#fff7df',stone:'#d9ceb4',grass:'#aec790',leaf:'#789f67',deep:'#355750',road:'#7c8981',highway:'#596b69',coral:'#df896e',yellow:'#e8c175',pink:'#dfa49a',mint:'#a9cdc1',glass:'#91b8b8',lilac:'#afa8c2',sand:'#e6d7b8',orange:'#d5a16f',white:'#f2f1df',blue:'#99bcc0'};
  const mats=new Map(),geos=new Map(),markers=new Map(),buildings=new Map(),interactive=[],colliders=[],reservedPlots=[],cars=[],people=[],windBits=[],modelMotions=[];
  const sportsMotions=new Map();
  const origin=new THREE.Vector3(0,1.1,0),targetLook=origin.clone(),look=origin.clone();
  let yaw=DEFAULT_YAW,targetYaw=DEFAULT_YAW,pitch=DEFAULT_PITCH,targetPitch=DEFAULT_PITCH,zoom=1,targetZoom=1,elapsed=0,introTime=0,paused=false,disposed=false,frame=0,hover=null,selected=null,nearby=null,connections=false,inspecting=false;
  let exhibit=null,exhibitHits=[],exhibitAction=()=>{},drag=null,visited=new Set(); const keys=new Set();
  const tempV=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3();
  function mat(c,extra={}){const key=c+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.88,...extra}));return mats.get(key);}
  function mesh(geo,c,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(parent,w,h,d,c,x=0,y=0,z=0,r=.1){r=Math.min(r,w/2.1,h/2.1,d/2.1);const k=`b${w},${h},${d},${r}`;if(!geos.has(k))geos.set(k,new RoundedBoxGeometry(w,h,d,2,r));return mesh(geos.get(k),c,parent,x,y,z);}
  function cyl(parent,rt,rb,h,c,x=0,y=0,z=0,n=16){const k=`c${rt},${rb},${h},${n}`;if(!geos.has(k))geos.set(k,new THREE.CylinderGeometry(rt,rb,h,n));return mesh(geos.get(k),c,parent,x,y,z);}
  function ball(parent,r,c,x=0,y=0,z=0){const k=`s${r}`;if(!geos.has(k))geos.set(k,new THREE.SphereGeometry(r,10,8));return mesh(geos.get(k),c,parent,x,y,z);}
  function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
  function sign(parent,text,w,h,x,y,z,bg=P.cream,fg=P.deep,rotation=0){
    const cvs=document.createElement('canvas');cvs.width=1024;cvs.height=Math.round(1024*h/w);const c=cvs.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,cvs.width,cvs.height);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${Math.min(cvs.height*.5,1024/(text.length*.62))}px Arial`;c.fillText(text,512,cvs.height*.52);const texture=new THREE.CanvasTexture(cvs);texture.colorSpace=THREE.SRGBColorSpace;
    const m=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}),parent,x,y,z);m.rotation.y=rotation;return m;
  }
  function groundText(text,x,z,w,h,rotation=0){const s=sign(world,text,w,h,x,.615,z,'#c8d3ad','#667c64');s.rotation.set(-Math.PI/2,0,rotation);return s;}
  function tree(parent,x,z,s=1,c=P.leaf){const g=group(parent,x,.4,z);g.scale.setScalar(s);cyl(g,.1,.16,1.05,'#aa936c',0,.52,0,7);ball(g,.64,c,0,1.45,0);ball(g,.44,'#a8c57b',.35,1.62,.1);ball(g,.46,'#628c65',-.33,1.35,.15);return g;}
  function lamp(parent,x,z){cyl(parent,.035,.06,1.8,P.deep,x,1.3,z,7);ball(parent,.17,P.cream,x,2.25,z);cyl(parent,.24,.24,.05,P.deep,x,2.43,z,12);}
  function bench(parent,x,z,angle=0){const g=group(parent,x,.53,z);g.rotation.y=angle;box(g,1.3,.12,.42,P.orange,0,.3,0,.03);box(g,1.3,.4,.08,P.orange,0,.56,-.2,.04);for(const a of [-.45,.45])box(g,.08,.4,.35,P.deep,a,.05,0,.02);}
  function windows(g,w,d,rows=2,cols=4,glass=P.glass,base=.8){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const dx=w/(cols+1);box(g,dx*.65,.48,.06,glass,(c-(cols-1)/2)*dx,base+r*.8,d/2+.04,.04);}for(let r=0;r<rows;r++)for(let k=0;k<3;k++)box(g,.06,.48,.55,glass,w/2+.04,base+r*.8,(k-1)*d/3.8,.03);}
  function roof(g,w,d,h,c,y){const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.closePath();return mesh(new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:.07,bevelSize:.08,bevelSegments:2,steps:1}),c,g,0,y,-d/2);}
  function bloom(parent,x,z,c=P.coral){cyl(parent,.025,.03,.27,P.leaf,x,.55,z,6);ball(parent,.11,c,x,.73,z);}
  function marker(id,g,height){const data=places.find(p=>p.id===id)||{label:id,number:''};const cvs=document.createElement('canvas');cvs.width=1024;cvs.height=230;const tex=new THREE.CanvasTexture(cvs);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:true,depthWrite:false}));spr.scale.set(8.0,1.8,1);spr.position.set(0,height,0);spr.userData.id=id;g.add(spr);markers.set(id,{canvas:cvs,texture:tex,sprite:spr,data});drawMarker(id);return spr;}
  function drawMarker(id){
    const o=markers.get(id);if(!o)return;
    const expanded=id===hover||id===selected||o.data.context,done=visited.has(id);
    if(o.canvas.width!==1024||o.canvas.height!==230){o.canvas.width=1024;o.canvas.height=230;}
    o.texture.repeat.set(expanded?1:230/1024,1);o.texture.offset.set(expanded?0:(1024-230)/2048,0);
    const c=o.canvas.getContext('2d');c.clearRect(0,0,o.canvas.width,o.canvas.height);
    c.fillStyle=done?'#d3b66d':'#fff8e9';c.beginPath();
    if(expanded)c.roundRect(8,12,1008,200,65);else c.arc(512,115,95,0,Math.PI*2);c.fill();
    c.fillStyle=done?'#39554a':(o.data.color||'#688c78');c.beginPath();c.arc(expanded?107:512,expanded?112:115,expanded?69:77,0,Math.PI*2);c.fill();
    c.fillStyle='#fffaf0';c.textAlign='center';c.textBaseline='middle';c.font=`700 ${expanded?66:75}px Arial`;c.fillText(done?'✓':String(o.data.number||''),expanded?107:512,115);
    if(expanded){c.fillStyle='#344b42';c.textAlign='left';const label=o.data.label||id;let size=82;c.font=`700 ${size}px Arial`;while(size>55&&c.measureText(label).width>770){size-=2;c.font=`700 ${size}px Arial`;}c.fillText(label,207,115);}
    o.sprite.scale.set(expanded?9.5:1.45,expanded?2.13:1.45,1);o.texture.needsUpdate=true;
  }
  function landmark(id,x,z){
    const g=group(world,x,.5,z);g.userData.id=id;buildings.set(id,g);interactive.push(g);
    let result;
    if(detailedAssets.has(id)){
      const limits=modelFitLimits(id);
      const fitted=fitModelAsset(detailedAssets.get(id),limits);g.add(fitted.group);g.userData.assetSize=fitted.size.clone();
      result={markerHeight:fitted.size.y+1.4,collider:id==='divide'?null:{w:fitted.size.x,d:fitted.size.z}};
      if(id==='divide')g.userData.localColliders=[-1,1].map(side=>({x:side*4.55*fitted.scale,z:0,w:1.35*fitted.scale,d:2.775*fitted.scale}));
      const motion=createIndustrialMotion(id,fitted.group);if(motion)modelMotions.push(motion);
      if(id==='basketball'||id==='golf'){const motion=createSportsMotion(fitted.group.children[0],id);sportsMotions.set(id,motion);modelMotions.push(motion.update);}
      if(id==='eurus'){
        box(g,8.2,.16,7.5,'#d9ceb5',0,.04,0,.55);fitted.group.position.y=.12;
        g.userData.assetSize.y+=.12;result.markerHeight+=.12;result.collider={w:8.2,d:7.8};
        sign(g,'EUROS · WINTER COLLECTION',5.8,.42,0,.49,3.8,P.cream,P.deep);
      }
    }else result=buildLandmarkModel(id,g,{THREE,P,box,cyl,ball,group,mesh,sign,roof,windows,tree,bench,windBits});
    if(result.collider){g.userData.collider={x,z,...result.collider};colliders.push(g.userData.collider);}
    marker(id,g,result.markerHeight);return g;
  }
  function littleHouse(x,z,w=2.8,c=P.cream,flat=false){const g=group(world,x,.4,z);box(g,w,1.65,2.4,c,0,.88,0,.12);if(flat)box(g,w+.2,.15,2.6,P.sand,0,1.78,0,.09);else roof(g,w+.4,2.7,.7,P.coral,1.68);box(g,.52,1.02,.09,P.deep,-.4,.63,1.24,.04);box(g,.7,.6,.07,P.glass,.6,1,1.24,.04);colliders.push({x,z,w:w+.2,d:2.5});return g;}

  const detailedAssets=await loadModelAssets();
  const studio=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
  const environmentTarget=pmrem.fromScene(studio,.04);scene.environment=environmentTarget.texture;scene.environmentIntensity=.45;studio.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#fff4e0','#a5b8a3',1.15));
  const sun=new THREE.DirectionalLight('#fff3da',2.65);sun.position.set(-70,100,50);sun.target.position.set(-24,0,0);scene.add(sun.target);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-100,right:100,top:75,bottom:-75,near:1,far:220});sun.shadow.bias=-.0003;sun.shadow.normalBias=.055;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight('#d5e8ed',.8);fill.position.set(33,25,-25);scene.add(fill);
  const floor=mesh(new THREE.PlaneGeometry(500,500),'#dce7dc',scene,0,-1.5,0);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
  const map=buildMapGround({world,MAP,h:{box,cyl,ball,group,mesh,sign,tree,P}});
  const fallbackPlots={city:{x:-25,z:-17},civic:{x:-11,z:-18},lab:{x:-27,z:1},wellness:{x:12,z:-18},culture:{x:26,z:-14},council:{x:15,z:17},basketball:{x:-27,z:24},golf:{x:-14,z:26},football:{x:-41,z:25},eurus:{x:12,z:0},daycare:{x:28,z:3},arts:{x:28,z:20},divide:{x:0,z:-25}};
  for(const p of places){
    const plot=MAP.contextLandmarks?.[p.id]||MAP.plots?.[p.id]||fallbackPlots[p.id];if(!plot)continue;
    if(p.id==='divide'){const q=map.nearest(plot);const g=landmark(p.id,q.p.x,q.p.z);g.rotation.y=Math.atan2(q.tangent.x,q.tangent.z);}
    else{const g=landmark(p.id,plot.x,plot.z);g.rotation.y=plot.rotation||0;}
    const g=buildings.get(p.id),size=g.userData.assetSize,c=g.userData.collider;
    if(c)c.rotation=g.rotation.y;
    for(const foot of g.userData.localColliders||[]){const a=g.rotation.y;colliders.push({...foot,x:g.position.x+foot.x*Math.cos(a)+foot.z*Math.sin(a),z:g.position.z-foot.x*Math.sin(a)+foot.z*Math.cos(a),rotation:a});}
    if(c||size)reservedPlots.push({id:p.id,x:g.position.x,z:g.position.z,w:c?.w||size.x,d:c?.d||size.z,rotation:g.rotation.y});
  }
  // The NIKI crossing is an imagined meeting place laid over the actual street map.
  const central=map.crossings.find(c=>c.conceptual)||map.crossings[Math.floor(map.crossings.length/2)];
  const centerPoint=central||{x:0,z:0};origin.set(MAP.view?.centerX??centerPoint.x,1.4,MAP.view?.centerZ??centerPoint.z);look.copy(origin);targetLook.copy(origin);
  try{
    const response=await fetch(new URL('./vendor/helvetiker_bold.typeface.json',import.meta.url));if(!response.ok)throw Error('font');
    const font=new FontLoader().parse(await response.json());const word=group(world,centerPoint.x,2.35,centerPoint.z-1.35);let width=0;
    const letterColors=[P.coral,P.yellow,'#679b7a',P.blue];
    [...'NIKI'].forEach((l,i)=>{const geo=new TextGeometry(l,{font,size:2.9,depth:.72,curveSegments:6,bevelEnabled:true,bevelThickness:.09,bevelSize:.09,bevelSegments:3});geo.computeBoundingBox();const w=geo.boundingBox.max.x-geo.boundingBox.min.x;mesh(geo,letterColors[i],word,width-geo.boundingBox.min.x,0,0);width+=w+.25;});word.position.x-=width/2;
    word.updateMatrixWorld(true);for(const letter of word.children){const b=new THREE.Box3().setFromObject(letter),size=b.getSize(new THREE.Vector3()),p=b.getCenter(new THREE.Vector3());colliders.push({x:p.x,z:p.z,w:size.x,d:size.z});}
  }catch{sign(world,'NIKI',8,2,centerPoint.x,2.3,centerPoint.z-1,P.cream);}
  // A few tall palms and lower street trees make the map feel like the peninsula.
  for(const c of map.crossings)reservedPlots.push({id:'bridge',x:c.x,z:c.z,w:c.width,d:c.length+12,rotation:c.angle});
  colliders.push(...map.addContext(reservedPlots));
  for(const c of map.crossings)for(const side of [-1,1]){
    const x=side*(c.width/2-.08);colliders.push({x:c.x+x*Math.cos(c.angle),z:c.z-x*Math.sin(c.angle),w:.065,d:c.length,rotation:c.angle});
  }
  function clearPlot(x,z,padding=1.8){return ![...reservedPlots,...colliders].some(c=>containsPoint(c,x,z,padding));}
  for(const road of map.roads.filter(r=>r.kind==='avenue')){
    for(let d=3;d<road.length-2;d+=4.1){const q=road.curve.getPointAt(d/road.length),v=road.curve.getTangentAt(d/road.length);for(const side of [-1,1]){const x=q.x+v.z*side*(road.width/2+1),z=q.z-v.x*side*(road.width/2+1);if(clearPlot(x,z)&&map.nearest({x,z}).distance>4.2){const s=.55+(Math.floor(d)%3)*.1;tree(world,x,z,s);colliders.push({x,z,w:.32*s,d:.32*s});}}}
  }
  for(const p of MAP.palms||[]){if(!clearPlot(p.x,p.z,1.7))continue;const g=group(world,p.x,.5,p.z);cyl(g,.1,.17,3.4,'#a78e68',0,1.7,0,9);for(let i=0;i<6;i++){const leaf=ball(g,.7,'#6e966b',Math.cos(i*Math.PI/3)*.6,3.45,Math.sin(i*Math.PI/3)*.6);leaf.scale.set(1.4,.2,.5);leaf.rotation.y=-i*Math.PI/3;}colliders.push({x:p.x,z:p.z,w:.34,d:.34});}
  const edgeZ=MAP.bounds.maxZ-1.5;
  map.groundLabel('PALO ALTO / EAST PALO ALTO',MAP.bounds.minX+17,edgeZ,26,1.05,'#60796b','#d9dfc5');
  map.groundLabel('REAL STREETS · IMAGINED LANDMARKS',MAP.bounds.maxX-17,edgeZ,26,.72,'#7b8c7a','#d9dfc5');
  function car(color,bus=false){const g=group(world);box(g,bus?1.04:.85,.4,bus?2.5:1.65,color,0,.34,0,.16);box(g,bus?.94:.72,.35,bus?2.1:.8,P.cream,0,.7,-.12,.12);box(g,bus?.78:.59,.22,.055,P.glass,0,.74,bus?1:.3,.04);for(const x of [bus?-.52:-.43,bus?.52:.43])for(const z of [bus?-.8:-.52,bus?.8:.52]){const w=cyl(g,.18,.18,.1,P.deep,x,.22,z,10);w.rotation.z=Math.PI/2;}return g;}
  for(let i=0;i<14;i++){const dir=i%2?1:-1;cars.push({mesh:car([P.coral,P.yellow,P.cream,P.blue,'#8ba999'][i%5],i===5),lane:dir*(.65+(Math.floor(i/2)%2)*1.2),phase:i/14,dir,speed:2.5+(i%4)*.35});}
  function person(parent,x,z,color=P.coral,scale=1){const g=group(parent,x,.6,z);g.scale.setScalar(scale);ball(g,.18,'#e8ba8d',0,.79,0);box(g,.32,.43,.25,color,0,.4,0,.1);for(const a of [-.09,.09])box(g,.1,.28,.12,P.deep,a,.09,0,.04);ball(g,.19,'#5b6551',0,.93,-.025).scale.set(1,.5,1);return g;}
  for(const [i,r] of map.roads.filter(r=>r.kind==='avenue').slice(0,8).entries()){
    for(const t of [.4,.6,.2,.8]){const q=r.curve.getPointAt(t),v=r.curve.getTangentAt(t),x=q.x+v.z*(r.width/2+.65),z=q.z-v.x*(r.width/2+.65);
      const route={x,z,w:.65,d:2,rotation:Math.atan2(v.x,v.z)};
      if([...reservedPlots,...colliders].some(c=>footprintsOverlap(route,c,.25))||map.nearest({x,z}).distance<4.2)continue;
      const g=person(world,x,z,[P.coral,P.blue,P.lilac,P.yellow][i%4],.9);g.position.y=.545;people.push({mesh:g,x,z,phase:i,v});break;
    }
  }
  const spawn={x:centerPoint.x-3.5,z:centerPoint.z};
  const player=person(world,spawn.x,spawn.z,P.coral,1.6);box(player,.3,.34,.18,P.yellow,0,.42,-.2,.09);
  const playerHalo=mesh(new THREE.RingGeometry(.48,.58,32),new THREE.MeshBasicMaterial({color:'#fff5c8',side:THREE.DoubleSide,transparent:true,opacity:.9}),world,spawn.x,.86,spawn.z);playerHalo.rotation.x=-Math.PI/2;
  const playerState={...spawn};let playerDirection=0;
  const connectionGroup=new THREE.Group();world.add(connectionGroup);connectionGroup.visible=false;
  function path(points,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));for(let i=0;i<80;i++){if(i%3===2)continue;const pos=curve.getPoint(i/79);const dot=ball(connectionGroup,.12,color,pos.x,pos.y,pos.z);dot.castShadow=false;}}
  for(const [i,c]of map.crossings.entries()){path([[c.x-12,.63,c.z-3],[c.x-5,.85,c.z],[c.x+5,.85,c.z],[c.x+12,.63,c.z+3]],i%2?'#d8a74f':'#30a59b');}
  function resize(){const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight),aspect=w/h;renderer.setSize(w,h,false);const mapWidth=MAP.bounds.maxX-MAP.bounds.minX,mapDepth=MAP.bounds.maxZ-MAP.bounds.minZ;const projectedW=mapWidth,projectedH=mapDepth*Math.sin(DEFAULT_PITCH)+12;const half=Math.max(projectedH/2+3,(projectedW/2+4)/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function cast(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);if(exhibit){const hits=raycaster.intersectObjects(exhibitHits,true);for(const hit of hits){let o=hit.object;while(o&&!o.userData.action)o=o.parent;if(o?.userData.action)return {action:o.userData.action};}return null;}const hits=raycaster.intersectObjects(interactive,true);for(const hit of hits){let o=hit.object;while(o&&!o.userData.id)o=o.parent;if(o?.userData.id)return {id:o.userData.id};}return null;}
  function down(e){if(e.button!==0)return;renderer.domElement.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY,moved:false,shift:e.shiftKey};renderer.domElement.setPointerCapture(e.pointerId);}
  function move(e){if(drag){if(Math.hypot(e.clientX-drag.ox,e.clientY-drag.oy)>5)drag.moved=true;if(drag.moved&&!exhibit){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.shift){right.set(Math.cos(yaw),0,-Math.sin(yaw));targetLook.addScaledVector(right,-dx*.045/zoom);targetLook.z-=dy*.045/zoom;targetLook.x=THREE.MathUtils.clamp(targetLook.x,MAP.bounds.minX+3,MAP.bounds.maxX-3);targetLook.z=THREE.MathUtils.clamp(targetLook.z,MAP.bounds.minZ+3,MAP.bounds.maxZ-3);}else{targetYaw-=dx*.004;targetPitch=THREE.MathUtils.clamp(targetPitch+dy*.0025,.48,1.15);}}drag.x=e.clientX;drag.y=e.clientY;renderer.domElement.style.cursor=drag.moved?'grabbing':'pointer';return;}const hit=cast(e),id=hit?.id||null;if(id!==hover){const old=hover;hover=id;drawMarker(old);drawMarker(id);onHover(id);}renderer.domElement.style.cursor=hit?'pointer':exhibit?'default':'grab';}
  function release(e){if(drag&&!drag.moved){const h=cast(e);if(h?.action)exhibitAction(h.action);else if(h?.id)onSelect(h.id);}drag=null;renderer.domElement.style.cursor=exhibit?'default':'grab';}
  function cancel(){drag=null;const old=hover;hover=null;drawMarker(old);onHover(null);}
  function wheel(e){if(exhibit)return;e.preventDefault();targetZoom=THREE.MathUtils.clamp(targetZoom-e.deltaY*.0015,.65,12);}
  function typing(e){return ['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable;}
  function keydown(e){if(typing(e))return;if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(e.key.toLowerCase())){if(exhibit||inspecting)return;keys.add(e.key.toLowerCase());e.preventDefault();}if(!e.repeat&&e.key.toLowerCase()==='e'&&nearby&&!exhibit)onSelect(nearby);if(!e.repeat&&e.key.toLowerCase()==='r'&&!exhibit)reset();}
  function keyup(e){keys.delete(e.key.toLowerCase());}
  function blur(){keys.clear();drag=null;}
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',release);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('pointerleave',()=>{if(!drag)cancel();});renderer.domElement.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
  function onBridge(x,z){return map.crossings.some(c=>{const dx=x-c.x,dz=z-c.z,lx=dx*Math.cos(c.angle)-dz*Math.sin(c.angle),lz=dx*Math.sin(c.angle)+dz*Math.cos(c.angle);return Math.abs(lx)<c.width/2-.1&&Math.abs(lz)<c.length/2+6;});}
  function bridgeHeight(x,z){for(const c of map.crossings){const dx=x-c.x,dz=z-c.z,lx=dx*Math.cos(c.angle)-dz*Math.sin(c.angle),lz=dx*Math.sin(c.angle)+dz*Math.cos(c.angle);if(Math.abs(lx)<c.width/2&&Math.abs(lz)<c.length/2+6)return 2.3-Math.max(0,Math.abs(lz)-c.length/2)/6*1.75;}return .55;}
  function walkable(x,z){const b=MAP.bounds;if(x<b.minX+.7||x>b.maxX-.7||z<b.minZ+.7||z>b.maxZ-.7)return false;if(map.nearest({x,z}).distance<map.highway.width/2+.35&&!onBridge(x,z))return false;for(const c of colliders)if(containsPoint(c,x,z,.3))return false;return true;}
  function reset(){inspecting=false;const old=selected;selected=null;drawMarker(old);targetLook.copy(origin);targetYaw=DEFAULT_YAW;targetPitch=DEFAULT_PITCH;targetZoom=1;keys.clear();}
  function focus(id){if(!buildings.has(id))return;inspecting=false;const old=selected;selected=id;drawMarker(old);drawMarker(id);targetYaw=DEFAULT_YAW;const p=buildings.get(id).position;targetLook.set(p.x,2.5,p.z);targetZoom=1.5;}
  function inspect(id){
    if(!buildings.has(id))return;
    inspecting=true;const old=selected;selected=id;drawMarker(old);drawMarker(id);keys.clear();
    const g=buildings.get(id);let size=g.userData.assetSize;
    if(!size){const bound=new THREE.Box3();g.traverse(o=>{if(o.isMesh){const b=new THREE.Box3().setFromObject(o);bound.union(b);}});size=bound.getSize(new THREE.Vector3());}
    targetLook.set(g.position.x,g.position.y+size.y*.43,g.position.z);targetYaw=DEFAULT_YAW;targetPitch=['basketball','golf','football'].includes(id)?.78:.55;
    const span=Math.max(size.x,size.z)*1.32;
    targetZoom=THREE.MathUtils.clamp(Math.min((camera.right-camera.left)*.68/span,(camera.top-camera.bottom)*.74/(size.y+size.z*.35)),1.4,11);
  }
  function update(dt){
    dt=Math.max(0,Math.min(dt,.05));introTime+=dt;if(!paused)elapsed+=dt;const f=1-Math.exp(-dt*8);yaw+=(targetYaw-yaw)*f;pitch+=(targetPitch-pitch)*f;zoom+=(targetZoom-zoom)*f;look.lerp(targetLook,f);
    const intro=reduce?1:THREE.MathUtils.clamp(introTime/2.6,0,1),ease=1-Math.pow(1-intro,3);const ang=yaw,distance=90;camera.position.set(look.x+Math.sin(ang)*Math.cos(pitch)*distance,look.y+Math.sin(pitch)*distance,look.z+Math.cos(ang)*Math.cos(pitch)*distance);camera.lookAt(look);camera.zoom=zoom*(.9+.1*ease);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    if(!paused&&!exhibit&&!inspecting){let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);let dz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(dx||dz){const len=Math.hypot(dx,dz);dx/=len;dz/=len;const wx=(dx*Math.cos(yaw)+dz*Math.sin(yaw))*dt*5,wz=(-dx*Math.sin(yaw)+dz*Math.cos(yaw))*dt*5;if(walkable(playerState.x+wx,playerState.z))playerState.x+=wx;if(walkable(playerState.x,playerState.z+wz))playerState.z+=wz;playerDirection=Math.atan2(wx,wz);player.rotation.y=playerDirection;onMove({...playerState});}}
    const py=bridgeHeight(playerState.x,playerState.z);player.position.set(playerState.x,py+.08+(!reduce&&keys.size?Math.abs(Math.sin(elapsed*15))*.045:0),playerState.z);playerHalo.position.set(playerState.x,py+.01,playerState.z);playerHalo.scale.setScalar(1+(!reduce?Math.sin(elapsed*3)*.05:0));
    nearby=null;let nearest=5.8;for(const [id,g]of buildings){const dist=Math.hypot(g.position.x-playerState.x,g.position.z-playerState.z);if(dist<nearest){nearest=dist;nearby=id;}const marker=markers.get(id);if(marker){marker.sprite.visible=!inspecting;marker.sprite.material.opacity=exhibit&&id!==selected ? .35 : 1;}}
    for(const c of cars){const t=THREE.MathUtils.euclideanModulo(c.phase+(reduce?0:elapsed*c.speed*c.dir/map.highway.length),1);const p=map.highway.curve.getPointAt(t),v=map.highway.curve.getTangentAt(t);c.mesh.position.set(p.x+v.z*c.lane,.54,p.z-v.x*c.lane);c.mesh.rotation.y=Math.atan2(v.x,v.z)+(c.dir<0?Math.PI:0);}
    if(!paused&&!reduce)windBits.forEach((g,i)=>{g.rotation.z=Math.sin(elapsed*2+i)*.035;});
    if(!paused&&!reduce)for(const p of people){const walk=Math.sin(elapsed*.22+p.phase)*.65;p.mesh.position.x=p.x+p.v.x*walk;p.mesh.position.z=p.z+p.v.z*walk;p.mesh.rotation.y=Math.atan2(p.v.x,p.v.z)+(Math.cos(elapsed*.22+p.phase)>0?0:Math.PI);}
    modelMotions.forEach(updateModel=>updateModel(reduce?0:elapsed));
    if(exhibit){right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);const forward=new THREE.Vector3();camera.getWorldDirection(forward);const viewHeight=(camera.top-camera.bottom)/camera.zoom,viewWidth=(camera.right-camera.left)/camera.zoom;const cinema=exhibit.userData.cinema;const scale=Math.min(viewHeight*(cinema ? .86 : .78)/13,viewWidth*(cinema ? .88 : .62)/18);exhibit.scale.setScalar(scale);exhibit.position.copy(camera.position).addScaledVector(forward,32).addScaledVector(right,cinema?0:-viewWidth*.17).addScaledVector(up,viewHeight*.005);exhibit.quaternion.copy(camera.quaternion);exhibit.updateMatrixWorld(true);}
  }
  function render(){renderer.render(scene,camera);}
  let last=performance.now();function animate(t){if(disposed)return;frame=requestAnimationFrame(animate);const dt=THREE.MathUtils.clamp((t-last)/1000,0,.05);last=t;update(dt);render();}frame=requestAnimationFrame(animate);onReady();
  return {scene,camera,renderer,reset,focus,inspect,zoom(delta){targetZoom=THREE.MathUtils.clamp(targetZoom+delta*(inspecting?4:1),.65,12);},setPaused(v){paused=!!v;},setVisited(ids){visited=new Set(ids);for(const id of markers.keys())drawMarker(id);},setConnections(v){connections=!!v;connectionGroup.visible=connections;},
    setExhibit(g,hits,onAction){if(exhibit&&exhibit!==g)scene.remove(exhibit);exhibit=g;exhibitHits=hits||[];exhibitAction=onAction||(()=>{});if(g.parent!==scene)scene.add(g);keys.clear();targetZoom=1.38;targetPitch=.77;if(selected&&buildings.has(selected)){const p=buildings.get(selected).position;right.set(Math.cos(targetYaw),0,-Math.sin(targetYaw));const offset=(camera.right-camera.left)/targetZoom*.29;targetLook.copy(p).addScaledVector(right,-offset);targetLook.y=1.8;}},
    clearExhibit(){if(exhibit)scene.remove(exhibit);exhibit=null;exhibitHits=[];exhibitAction=()=>{};keys.clear();},
    getState(){return {mode:exhibit?'exhibit':inspecting?'inspect':'explore',player:{x:+playerState.x.toFixed(2),z:+playerState.z.toFixed(2)},selected,nearby,connections,visited:[...visited],modelsLoaded:[...detailedAssets.keys()],sports:Object.fromEntries([...sportsMotions].map(([id,motion])=>[id,motion.state])),performance:{drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles},camera:{yaw:+yaw.toFixed(2),pitch:+pitch.toFixed(2),zoom:+zoom.toFixed(2)},landmarks:[...buildings].map(([id,g])=>({id,x:g.position.x,z:g.position.z})),coordinates:'Rotated local map of Palo Alto / East Palo Alto. Street geometry from OpenStreetMap. Portfolio buildings and the NIKI footbridge are imagined.',crossings:map.crossings.map(c=>({name:c.name,x:+c.x.toFixed(1),z:+c.z.toFixed(1)}))};},
    advanceTime(ms){for(let remaining=Math.max(0,ms);remaining>0;remaining-=1000/60)update(Math.min(remaining/1000,1/60));render();},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',release);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('wheel',wheel);const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ms.add(m);if(m.map)ts.add(m.map);});});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose());ts.forEach(x=>x.dispose());environmentTarget.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}
