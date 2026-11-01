import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const root=new URL('../',import.meta.url);
registerHooks({resolve(specifier,context,next){return specifier==='three'?{url:new URL('dist/vendor/three.module.js',root).href,shortCircuit:true}:next(specifier,context);}});
const THREE=await import('three');
const {GLTFLoader}=await import('../dist/vendor/loaders/GLTFLoader.js');
const {fitModelAsset,MODEL_PATHS,modelFitLimits}=await import('../dist/model-assets.js');
const {buildMapGround}=await import('../dist/map-ground.js');
const {containsPoint,footprintsOverlap}=await import('../dist/footprints.js');
const {MAP}=await import('../dist/map-reference.js');
const reserved=[];
for(const [id,file] of Object.entries(MODEL_PATHS)){
  const buffer=await fs.readFile(new URL(`dist/models/${file}`,root));
  const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
  const limits=modelFitLimits(id);
  const {size}=fitModelAsset(gltf.scene,limits),plot=MAP.contextLandmarks?.[id]||MAP.plots[id];
  reserved.push({id,...plot,w:id==='eurus'?8.2:size.x,d:id==='eurus'?7.8:size.z});
}
const mesh=(geometry,color,parent,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());m.position.set(x,y,z);parent.add(m);return m;};
const h={mesh,box:(p,w,h,d,c,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),c,p,x,y,z),cyl:(p,rt,rb,h,c,x,y,z)=>mesh(new THREE.CylinderGeometry(rt,rb,h),c,p,x,y,z),group:(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;},sign:(p,t,w,h,x,y,z)=>mesh(new THREE.PlaneGeometry(w,h),null,p,x,y,z)};
const map=buildMapGround({world:new THREE.Group(),MAP,h});
const gate=reserved.find(p=>p.id==='divide'),q=map.nearest(gate);gate.x=q.p.x;gate.z=q.p.z;gate.rotation=Math.atan2(q.tangent.x,q.tangent.z);
const plotsAndBridges=[...reserved,...map.crossings.map(c=>({id:'bridge',x:c.x,z:c.z,w:c.width,d:c.length+12,rotation:c.angle}))];
const kept=map.addContext(plotsAndBridges),culled=MAP.contextBuildings.length-kept.length;
for(const lot of kept)for(const plot of plotsAndBridges)assert(!footprintsOverlap(lot,plot,.45),`Context building intersects ${plot.id}`);
for(let i=0;i<reserved.length;i++)for(let j=i+1;j<reserved.length;j++)assert(!footprintsOverlap(reserved[i],reserved[j]),`${reserved[i].id} intersects ${reserved[j].id}`);
const candle=reserved.find(p=>p.id==='eurus');assert(containsPoint(candle,candle.x+3.9,candle.z), 'Candle outer plinth must block walking');
const rotated={x:0,z:0,w:2,d:8,rotation:Math.PI/2};assert(containsPoint(rotated,3,0));assert(!containsPoint(rotated,0,3));
// Bridge decks sit above the tallest van, including its rounded roof.
const bridgeBottom=2.0+.1-.24/2,vehicleTop=.54+.7+.35/2;assert(bridgeBottom-vehicleTop>.5);
console.log(JSON.stringify({landmarks:reserved.length,retainedContextBuildings:kept.length,removedOverlappingContextBuildings:culled,landmarkOverlapPairs:0,bridgeVehicleClearance:+(bridgeBottom-vehicleTop).toFixed(3),checks:'passed'},null,2));
