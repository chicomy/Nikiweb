import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';

export const MODEL_PATHS={eurus:'eurus-candle.glb',hpGarage:'hp-garage.glb',lab:'feel-to-read.glb',city:'daqing-pumpjack.glb',divide:'divided-101.glb',arts:'playhouse.glb',council:'music-studio.glb',culture:'culture-pavilion.glb',civic:'civic-hall.glb',wellness:'care-cottage.glb',daycare:'learning-garden.glb',basketball:'basketball-court.glb',golf:'golf-green.glb',football:'football-pitch.glb'};
export function modelFitLimits(id){
  return ({hpGarage:{height:5.8,maxWidth:8.2,maxDepth:9.4},basketball:{height:5,maxWidth:7,maxDepth:6.9},golf:{height:5,maxWidth:6,maxDepth:8.6},football:{height:4,maxWidth:8.2,maxDepth:6},divide:{height:8.4,maxWidth:10.8,maxDepth:4}})[id]||{height:8,maxWidth:8.2,maxDepth:7.8};
}

export async function loadModelAssets(){
  const loader=new GLTFLoader();
  const models=new Map();
  await Promise.all(Object.entries(MODEL_PATHS).map(async([id,file])=>{
    try{const gltf=await loader.loadAsync(new URL(`./models/${file}`,import.meta.url).href);models.set(id,gltf.scene);}
    catch(error){console.warn(`Unable to load ${file}; using the available scene fallback.`,error.message);}
  }));
  return models;
}

export function fitModelAsset(source,{height=8,maxWidth=9,maxDepth=9}={}){
  const model=source.clone(true);model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=Math.min(height/size.y,maxWidth/size.x,maxDepth/size.z);
  model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if(m.map)m.map.anisotropy=4;if(m.transmission>0){o.castShadow=false;m.envMapIntensity=1.2;}});});
  const group=new THREE.Group();group.add(model);
  return {group,size:size.multiplyScalar(scale),scale};
}
