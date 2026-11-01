// Run with Node from niki-city; loads the actual GLB vertex buffers into Three.js.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const threeURL=pathToFileURL(process.cwd()+'/dist/vendor/three.module.js').href;
const THREE=await import(threeURL);
const source=(await readFile('dist/industrial-motion.js','utf8')).replace("from 'three'",`from '${threeURL}'`);
const {createIndustrialMotion}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
async function glb(file){
 const bytes=await readFile(file);const n=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+n));const data=bytes.subarray(28+n);
 const components={5126:[4,'getFloat32'],5125:[4,'getUint32'],5123:[2,'getUint16'],5121:[1,'getUint8']};
 function accessor(index){const a=doc.accessors[index],b=doc.bufferViews[a.bufferView],[size,read]=components[a.componentType];const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],stride=b.byteStride||size*width,offset=(b.byteOffset||0)+(a.byteOffset||0);const d=new DataView(data.buffer,data.byteOffset,data.byteLength),v=[];for(let i=0;i<a.count;i++)for(let c=0;c<width;c++)v.push(d[read](offset+i*stride+c*size,true));return v;}
 const nodes=doc.nodes.map((node,index)=>{
  let o=new THREE.Group();
  if(node.mesh!==undefined){const defs=doc.meshes[node.mesh].primitives;const meshes=defs.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(accessor(p.attributes.POSITION),3));if(p.indices!==undefined)g.setIndex(accessor(p.indices));const m=new THREE.Mesh(g);m.userData.materialName=doc.materials[p.material]?.name;return m;});if(meshes.length===1)o=meshes[0];else meshes.forEach(m=>o.add(m));}
  o.name=node.name||String(index);if(node.matrix)o.matrix.fromArray(node.matrix).decompose(o.position,o.quaternion,o.scale);else{if(node.translation)o.position.fromArray(node.translation);if(node.rotation)o.quaternion.fromArray(node.rotation);if(node.scale)o.scale.fromArray(node.scale);}return o;
 });
 doc.nodes.forEach((n,i)=>(n.children||[]).forEach(j=>nodes[i].add(nodes[j])));const root=new THREE.Group();doc.scenes[doc.scene||0].nodes.forEach(i=>root.add(nodes[i]));root.updateMatrixWorld(true);return root;
}
const root=await glb('dist/models/daqing-pumpjack.glb'),update=createIndustrialMotion('city',root),rod=root.getObjectByName('pump_polished_rod'),shaft=root.getObjectByName('pump_polished_rod_Steel');
const names=['pump_crank_front','pump_crank_back','pump_pitman_front','pump_pitman_back','pump_beam'];
const nodes=Object.fromEntries(names.map(n=>[n,root.getObjectByName(n)]));
const stats={phases:360,rodXError:0,rodBottomMin:Infinity,rodBottomMax:-Infinity,crankBaseClearance:Infinity,beamFrameDepthClearance:Infinity,pitmanFrameDepthClearance:Infinity,crankHousingDepthClearance:Infinity,motorEndplateClearance:Infinity,bridleEndpointError:0};
const v=new THREE.Vector3();
function vertices(node,fn){node.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);fn(v,o);}});}
for(let i=0;i<stats.phases;i++){
 update(i*Math.PI*2/(.83*stats.phases));root.updateMatrixWorld(true);stats.rodXError=Math.max(stats.rodXError,Math.abs(rod.position.x-3.57));
 let bottom=Infinity;vertices(shaft,p=>{bottom=Math.min(bottom,p.y);});stats.rodBottomMin=Math.min(stats.rodBottomMin,bottom);stats.rodBottomMax=Math.max(stats.rodBottomMax,bottom);
 // The A-frame legs occupy depth bands around Z=±.56 (radius .12).
 // Test actual beam triangles whose X extent could cross the frame, excluding
 // the intentionally shared main bearing and rear pitman shaft.
 nodes.pump_beam.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,idx=o.geometry.index;const p=new THREE.Vector3(),q=new THREE.Vector3(),r=new THREE.Vector3();for(let k=0;k<idx.count;k+=3){p.fromBufferAttribute(a,idx.getX(k)).applyMatrix4(o.matrixWorld);q.fromBufferAttribute(a,idx.getX(k+1)).applyMatrix4(o.matrixWorld);r.fromBufferAttribute(a,idx.getX(k+2)).applyMatrix4(o.matrixWorld);if(Math.min(p.x,q.x,r.x)>1.4||Math.max(p.x,q.x,r.x)<-1.4)continue;stats.beamFrameDepthClearance=Math.min(stats.beamFrameDepthClearance,.44-Math.max(Math.abs(p.z),Math.abs(q.z),Math.abs(r.z)));}});
 for(const side of ['front','back']){
  vertices(nodes[`pump_crank_${side}`],p=>{stats.crankBaseClearance=Math.min(stats.crankBaseClearance,p.y-.93);stats.crankHousingDepthClearance=Math.min(stats.crankHousingDepthClearance,Math.abs(p.z)-.60);if(Math.abs(p.z)<.75)stats.motorEndplateClearance=Math.min(stats.motorEndplateClearance,Math.hypot(p.x+2.7,p.y-1.2)-.36);});
  vertices(nodes[`pump_pitman_${side}`],p=>{stats.pitmanFrameDepthClearance=Math.min(stats.pitmanFrameDepthClearance,Math.abs(p.z)-.68);});
  const sign=side==='front'?-1:1,m=root.getObjectByName(`pump_bridle_${side}`),end=new THREE.Vector3(0,.5,0).applyMatrix4(m.matrixWorld);stats.bridleEndpointError=Math.max(stats.bridleEndpointError,end.distanceTo(new THREE.Vector3(3.57,rod.position.y-.02,sign*.1)));
 }
}
// Visor front is one continuous outward-facing surface, with no folded facets.
const head=await glb('dist/models/feel-to-read.glb');let badFaces=0,faces=0;
head.traverse(o=>{if(!o.isMesh||!o.userData.materialName?.startsWith('Glass'))return;const a=o.geometry.attributes.position,idx=o.geometry.index;const p=new THREE.Vector3(),q=new THREE.Vector3(),r=new THREE.Vector3();for(let i=0;i<idx.count;i+=3){p.fromBufferAttribute(a,idx.getX(i));q.fromBufferAttribute(a,idx.getX(i+1));r.fromBufferAttribute(a,idx.getX(i+2));q.sub(p);r.sub(p);if(q.cross(r).z<-1e-9)badFaces++;faces++;}});
stats.visorTriangles=faces;stats.visorFoldedTriangles=badFaces;
const gate=await glb('dist/models/divided-101.glb');let left=-Infinity,right=Infinity,clearHeight=Infinity;
gate.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,idx=o.geometry.index,p=new THREE.Vector3(),q=new THREE.Vector3(),r=new THREE.Vector3();for(let k=0;k<idx.count;k+=3){p.fromBufferAttribute(a,idx.getX(k)).applyMatrix4(o.matrixWorld);q.fromBufferAttribute(a,idx.getX(k+1)).applyMatrix4(o.matrixWorld);r.fromBufferAttribute(a,idx.getX(k+2)).applyMatrix4(o.matrixWorld);const lo=Math.min(p.x,q.x,r.x),hi=Math.max(p.x,q.x,r.x),y=Math.min(p.y,q.y,r.y);if(y<1.4){if(hi<0)left=Math.max(left,hi);if(lo>0)right=Math.min(right,lo);}if(lo<1&&hi>-1)clearHeight=Math.min(clearHeight,y);}});
stats.gatewayFootOpening=right-left;stats.gatewayRoadClearHeight=clearHeight;

console.log(JSON.stringify(stats,null,2));
await writeFile('models/industrial/collision-audit.json',JSON.stringify(stats,null,2));
if(stats.rodXError>1e-8||stats.rodBottomMin<.79||stats.rodBottomMax>.81||stats.crankBaseClearance<0||stats.beamFrameDepthClearance<0||stats.pitmanFrameDepthClearance<0||stats.crankHousingDepthClearance<0||badFaces)throw Error('Industrial model collision audit failed');
