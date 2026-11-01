import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const threeURL=pathToFileURL(path.join(project,'dist/vendor/three.module.js')).href;
const THREE=await import(threeURL);
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'niki-sports-audit-'));
let rounded=await fs.readFile(path.join(project,'dist/vendor/RoundedBoxGeometry.js'),'utf8');
rounded=rounded.replaceAll("from 'three'",`from '${threeURL}'`);await fs.writeFile(path.join(temp,'rounded.mjs'),rounded);
let source=await fs.readFile(path.join(project,'dist/sports-motion.js'),'utf8');
source=source.replace("from 'three'",`from '${threeURL}'`).replace("from './vendor/RoundedBoxGeometry.js'","from './rounded.mjs'");
source=source.replace('return {update,state};','return {update,state,audit:{ensemble,dribbler,shooter,defender,golfer,mentor,dribbleBall,shotBall,puttBall,club,clubFace,clubShaft}};');
await fs.writeFile(path.join(temp,'motion.mjs'),source);
globalThis.document={createElement(){return {width:64,height:64,getContext(){return {fillText(){}};}};}};
const {createSportsMotion}=await import(pathToFileURL(path.join(temp,'motion.mjs')).href);
// Reconstruct the former survey coordinates for numerical comparisons only.
// Production parents remain centered; each kind applies its own export offset.
const parent=new THREE.Group(),basketParent=new THREE.Group(),golfParent=new THREE.Group();
basketParent.position.set(-2.75,0,-1.125);golfParent.position.set(3.15,0,0);parent.add(basketParent,golfParent);
const basketMotion=createSportsMotion(basketParent,'basketball'),golfMotion=createSportsMotion(golfParent,'golf');
assert.equal(basketMotion.audit.ensemble.children.length,5,'Basketball creates only three players and two balls');
assert.equal(golfMotion.audit.ensemble.children.length,4,'Golf creates only two participants, a ball and a club');
assert.equal(basketMotion.audit.golfer,null);assert.equal(golfMotion.audit.shooter,null);
const motion={update(t){basketMotion.update(t);golfMotion.update(t);}},a={...basketMotion.audit,...golfMotion.audit};
for(const key of ['dribbler','shooter','defender','dribbleBall','shotBall'])a[key]=basketMotion.audit[key];
const p=new THREE.Vector3(),q=new THREE.Vector3();
const glb=await fs.readFile(path.join(project,'dist/models/golf-green.glb'));
const jsonSize=glb.readUInt32LE(12),doc=JSON.parse(glb.subarray(20,20+jsonSize).toString()),binStart=20+jsonSize+8;
// Read actual exported wood and metal-leg vertices, including node transforms.
// This selects the complete right-hand bench rather than assuming its bounds.
const rightBench=new THREE.Box3();
function readBenchNode(index,parentMatrix){
 const n=doc.nodes[index],local=n.matrix?new THREE.Matrix4().fromArray(n.matrix):new THREE.Matrix4().compose(new THREE.Vector3(...(n.translation||[0,0,0])),new THREE.Quaternion(...(n.rotation||[0,0,0,1])),new THREE.Vector3(...(n.scale||[1,1,1]))),matrix=parentMatrix.clone().multiply(local);
 if(n.mesh!==undefined)for(const prim of doc.meshes[n.mesh].primitives){
  const material=doc.materials[prim.material].name;
  if(!material.startsWith('Wood')&&!material.startsWith('Steel'))continue;
  const acc=doc.accessors[prim.attributes.POSITION],view=doc.bufferViews[acc.bufferView],base=binStart+(view.byteOffset||0)+(acc.byteOffset||0),stride=view.byteStride||12;
  for(let i=0;i<acc.count;i++){
   p.set(glb.readFloatLE(base+i*stride),glb.readFloatLE(base+i*stride+4),glb.readFloatLE(base+i*stride+8)).applyMatrix4(matrix);
   if(p.x>4&&p.x<5.4&&p.y>.2&&p.y<1.2&&p.z>3.1&&p.z<3.7)rightBench.expandByPoint(p);
  }
 }
 for(const child of n.children||[])readBenchNode(child,matrix);
}
for(const i of doc.scenes[doc.scene||0].nodes)readBenchNode(i,new THREE.Matrix4().makeTranslation(3.15,0,0));
assert(!rightBench.isEmpty(),'Right bench geometry must be present');
const boxGap=(a,b)=>Math.max(a.min.x-b.max.x,b.min.x-a.max.x,a.min.y-b.max.y,b.min.y-a.max.y,a.min.z-b.max.z,b.min.z-a.max.z);
const ranges={};
function record(name,value,t){const r=ranges[name]??={min:Infinity,max:-Infinity,at:0};if(value<r.min){r.min=value;r.at=t;}r.max=Math.max(r.max,value);}
function minMeshY(root){let min=Infinity;root.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);min=Math.min(min,p.y);}});return min;}
function terrain(x,z){
 let h=.28;
 if(((x-3.05)/2.42)**2+(z/3.75)**2<=1)h=.36;
 if(((x-3.02)/2.05)**2+((z+.10)/3.28)**2<=1)h=.407;
 if(((x-4.05)/.81)**2+((z-1.75)/1.17)**2<=1)h=.4305;
 if(((x-4.05)/.70)**2+((z-1.75)/1.04)**2<=1)h=.4475;
 if(x>=-5.35&&x<=-.15&&z>=-3.825&&z<=1.85)h=.35; // Maximum paint height of the single half-court.
 return h;
}
for(let frame=0;frame<=3360;frame++){
 const t=frame/60;motion.update(t);parent.updateMatrixWorld(true);
 const mentorBox=new THREE.Box3().setFromObject(a.mentor.root,true);
 record('mentorWholeBodyVsBench',boxGap(mentorBox,rightBench),t);
 for(const [i,leg]of a.mentor.legs.entries())for(const name of ['shoe','sole'])record(`mentor${name}${i}VsBench`,boxGap(new THREE.Box3().setFromObject(leg[name],true),rightBench),t);
 for(const [id,floor]of [['dribbler',.35],['shooter',.35],['defender',.35],['golfer',.407],['mentor',.28]])record(id+'Ground',minMeshY(a[id].root)-floor,t);
 for(const id of ['dribbler','shooter','defender','golfer','mentor']){
  for(const leg of a[id].legs)for(const foot of [leg.shoe,leg.sole]){
   const pos=foot.geometry.attributes.position;
   for(let k=0;k<pos.count;k++){p.fromBufferAttribute(pos,k).applyMatrix4(foot.matrixWorld);record(id+'Terrain',p.y-terrain(p.x,p.z),t);if(['dribbler','shooter','defender'].includes(id))record(id+'InsideHalfCourt',Math.min(p.x+5.10,-.40-p.x,p.z+3.55,1.60-p.z),t);}
  }
  a[id].head.getWorldPosition(p);a.shotBall.getWorldPosition(q);record('shotVs'+id,q.distanceTo(p)-.179-.22,t);
  a.dribbleBall.getWorldPosition(q);record('dribbleVs'+id,q.distanceTo(p)-.179-.22,t);
 }
 const b=a.shotBall.position,rho=Math.hypot(b.x+2.75,b.z+2.93);record('shotRim',Math.hypot(rho-.29,b.y-2.48)-.031-.179,t);
 // Basketball net tapers toward the bottom; inspect the falling central ball.
 if(t%4.8>2.55&&t%4.8<3.12&&b.y<2.55&&b.y>1.85){
  let min=Infinity;for(let j=0;j<=80;j++){const u=j/80,rr=.28-.06*u;min=Math.min(min,Math.hypot(rr,2.46-.40*u-b.y)-.010-.179);}record('net',min,t);
 }
 record('dribbleGround',a.dribbleBall.position.y-.179-.325,t);
 record('shotGround',a.shotBall.position.y-.179-.338,t);
 for(const [name,ball]of [['dribble',a.dribbleBall],['shot',a.shotBall]])record(name+'BallInsideHalfCourt',Math.min(ball.position.x+5.10,-.40-ball.position.x,ball.position.z+3.55,1.60-ball.position.z)-.179,t);
 for(const sign of [-1]){
  const zs=[sign*3.1975,sign*3.315].sort((x,y)=>x-y);
  const board=new THREE.Box3(new THREE.Vector3(-3.38,2.29,zs[0]),new THREE.Vector3(-2.12,3.09,zs[1]));
  record('shotVsBackboard'+sign,board.distanceToPoint(a.shotBall.position)-.179,t);
  const zz=sign*3.4,base=new THREE.Box3(new THREE.Vector3(-3.075,.33,zz-.29),new THREE.Vector3(-2.425,.51,zz+.29));
  record('shotVsHoopBase'+sign,base.distanceToPoint(a.shotBall.position)-.179,t);
  const dy=Math.max(.41-a.shotBall.position.y,0,a.shotBall.position.y-2.71),dr=Math.max(0,Math.hypot(a.shotBall.position.x+2.75,a.shotBall.position.z-zz)-.075);
  record('shotVsPost'+sign,Math.hypot(dy,dr)-.179,t);
 }
 record('clubGround',minMeshY(a.club)-.407,t);
 for(const id of ['golfer','mentor']){
  const actor=a[id];
  // AABB separation is conservative for the club head versus feet.
  const headBox=new THREE.Box3().setFromObject(a.clubFace);
  for(const [i,leg]of actor.legs.entries()){
   const footBox=new THREE.Box3().setFromObject(leg.shoe);
   const gap=Math.max(footBox.min.x-headBox.max.x,headBox.min.x-footBox.max.x,footBox.min.y-headBox.max.y,headBox.min.y-footBox.max.y,footBox.min.z-headBox.max.z,headBox.min.z-footBox.max.z);
   record('clubHeadVs'+id+'Foot'+i,gap,t);
  }
  actor.head.getWorldPosition(p);const clubBox=new THREE.Box3().setFromObject(a.club);record('clubVs'+id+'Head',clubBox.distanceToPoint(p)-.22,t);
 }
 // Shaft segments against the golfer torso in body-local coordinates.
 const inv=a.golfer.body.matrixWorld.clone().invert(),shaft=a.clubShaft;
 const p0=new THREE.Vector3(0,-.5,0).applyMatrix4(shaft.matrixWorld).applyMatrix4(inv),p1=new THREE.Vector3(0,.5,0).applyMatrix4(shaft.matrixWorld).applyMatrix4(inv);
 const torso=new THREE.Box3(new THREE.Vector3(-.22,.545,-.135),new THREE.Vector3(.22,1.145,.135));
 let sg=Infinity;for(let j=0;j<=30;j++){p.copy(p0).lerp(p1,j/30);sg=Math.min(sg,torso.distanceToPoint(p)-.028);}record('shaftVsTorso',sg,t);
 if(a.puttBall.visible)record('puttVsFlag',Math.hypot(a.puttBall.position.x-2.75,a.puttBall.position.z+2.35)-.067-.023,t);
}
for(const [name,r]of Object.entries(ranges))assert(r.min>=-1e-5,`${name} intersects by ${-r.min} at ${r.at}s`);
// Read the exported bench vertices as an independent check of the static repair.
const wood=doc.meshes.find(m=>m.name.startsWith('Wood'));
let benchMinX=Infinity,benchMaxX=-Infinity;
for(const prim of wood.primitives){const acc=doc.accessors[prim.attributes.POSITION],view=doc.bufferViews[acc.bufferView],base=binStart+(view.byteOffset||0)+(acc.byteOffset||0),stride=view.byteStride||12;
 for(let i=0;i<acc.count;i++){const x=glb.readFloatLE(base+i*stride)+3.15,z=glb.readFloatLE(base+i*stride+8);benchMinX=Math.min(benchMinX,x);benchMaxX=Math.max(benchMaxX,x);assert(x>=.3&&x<=6&&Math.abs(z)<=4.15,'Bench extends beyond golf base');assert(!(x>-5.35&&x<-.15&&z>-3.825&&z<1.85),'Bench overlaps playing court');}
}
// Independently verify the centered basketball GLB after restoring survey coordinates.
const courtGLB=await fs.readFile(path.join(project,'dist/models/basketball-court.glb'));
const courtJSONSize=courtGLB.readUInt32LE(12),courtDoc=JSON.parse(courtGLB.subarray(20,20+courtJSONSize).toString()),courtBin=20+courtJSONSize+8;
for(const [prefix,zmin,zmax]of [['Court Clay',-3.826,1.851],['Glass',-3.316,-3.244]]){
 const m=courtDoc.meshes.find(m=>m.name.startsWith(prefix));assert(m,`${prefix} mesh exists`);
 for(const prim of m.primitives){const acc=courtDoc.accessors[prim.attributes.POSITION],view=courtDoc.bufferViews[acc.bufferView],base=courtBin+(view.byteOffset||0)+(acc.byteOffset||0),stride=view.byteStride||12;
  for(let i=0;i<acc.count;i++){const z=courtGLB.readFloatLE(base+i*stride+8)-1.125;assert(z>=zmin&&z<=zmax,`${prefix} contains obsolete full-court geometry`);}
 }
}
const courtWood=courtDoc.meshes.find(m=>m.name.startsWith('Wood'));
for(const prim of courtWood.primitives){const acc=courtDoc.accessors[prim.attributes.POSITION],view=courtDoc.bufferViews[acc.bufferView],base=courtBin+(view.byteOffset||0)+(acc.byteOffset||0),stride=view.byteStride||12;
 for(let i=0;i<acc.count;i++){const x=courtGLB.readFloatLE(base+i*stride),z=courtGLB.readFloatLE(base+i*stride+8);assert(Math.abs(x)<=3.35&&Math.abs(z)<=3.275,'Basketball bench extends beyond its own base');assert(x-2.75<=-5.35,'Basketball bench intrudes into playing area');}
}
for(const name of ['basketball-court','golf-green','football-pitch']){const bytes=await fs.readFile(path.join(project,`dist/models/${name}.glb`));assert.equal(bytes.toString('utf8',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);}
const report={independentModels:['basketball-court','golf-green','football-pitch'],motionKinds:['basketball','golf'],sourceCoordinateOffsets:{basketball:[2.75,0,1.125],golf:[-3.15,0,0]},basketballLayout:'one half-court, rear hoop only',sampleSeconds:56,sampleFrames:3361,allClearancesPositive:true,benchBoundsX:[benchMinX,benchMaxX],rightBenchBounds:{min:rightBench.min.toArray(),max:rightBench.max.toArray()},ranges};
console.log(JSON.stringify(report,null,2));
await fs.writeFile(path.join(project,'models/sports/clearance-audit.json'),JSON.stringify(report,null,2));
await fs.rm(temp,{recursive:true,force:true});
