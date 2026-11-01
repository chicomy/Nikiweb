import * as THREE from 'three';
import { footprintsOverlap } from './footprints.js';

// Geometry is kept separate from the street data so the portfolio landmarks can
// be moved without changing the referenced geography.
export function buildMapGround({world, MAP, h}) {
  const {box,cyl,ball,group,mesh,sign,tree,P}=h;
  const b=MAP.bounds, width=b.maxX-b.minX, depth=b.maxZ-b.minZ;
  const center={x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2};
  const baseY=.44;
  box(world,width+1.4,.65,depth+1.4,'#c4bda1',center.x,-.36,center.z,.7);
  box(world,width+1.1,.2,depth+1.1,'#f4eddc',center.x,.04,center.z,.5);
  box(world,width,.3,depth,'#d9dfc5',center.x,.26,center.z,.45);
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide});
  function polygon(points,color,y=.445){
    if(!points?.length)return;
    const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));
    const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
    const m=mesh(geo,material(color),world,0,y,0);m.castShadow=false;return m;
  }
  function curveFor(points,smooth=false,y=.5){
    const vs=points.map(([x,z])=>new THREE.Vector3(x,y,z));
    if(smooth)return new THREE.CatmullRomCurve3(vs,false,'centripetal');
    const path=new THREE.CurvePath();for(let i=1;i<vs.length;i++)path.add(new THREE.LineCurve3(vs[i-1],vs[i]));return path;
  }
  function ribbon(points,width,color,y=.5,smooth=false){
    if(points.length<2)return;
    const curve=curveFor(points,smooth,y),length=curve.getLength();
    const count=Math.max(24,Math.ceil(length*3)),pos=[],indices=[];
    for(let i=0;i<=count;i++){
      const t=i/count,p=curve.getPointAt(t),v=curve.getTangentAt(t).normalize();
      pos.push(p.x-v.z*width/2,y,p.z+v.x*width/2,p.x+v.z*width/2,y,p.z-v.x*width/2);
      if(i<count){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(indices);geo.computeVertexNormals();
    const m=mesh(geo,material(color),world);m.castShadow=false;return {curve,length,mesh:m,width};
  }
  function stripe(curve,offset,color,width=.045,y=.526,dash=1.1,gap=1.2){
    const length=curve.getLength();
    for(let d=.5;d<length-.4;d+=dash+gap){const t=d/length,p=curve.getPointAt(t),v=curve.getTangentAt(t).normalize();const g=box(world,width,.012,Math.min(dash,length-d),color,p.x+v.z*offset,y,p.z-v.x*offset,.006);g.rotation.y=Math.atan2(v.x,v.z);g.castShadow=false;}
  }
  function groundLabel(text,x,z,w=8,h=.6,color='#697b6a',background='#d9dfc5',angle=0){const m=sign(world,text,w,h,x,.566,z,background,color);m.rotation.set(-Math.PI/2,0,angle);m.castShadow=false;return m;}
  for(const area of MAP.areas||[])polygon(area.polygon,area.color||'#c2d1ac',.448);
  const waters=[];
  for(const water of MAP.water||[]){
    if(water.polygon){polygon(water.polygon,'#9fc8c3',.452);continue;}
    ribbon(water.points,(water.width||1.15)+1.1,'#a0bb97',.454,true);
    const river=ribbon(water.points,water.width||1.15,'#8dbbb9',.456,true);waters.push(river);
  }
  const roads=[];
  const ordered=[...(MAP.roads||[])].sort((a,b)=>(a.kind==='highway'?1:0)-(b.kind==='highway'?1:0));
  for(const r of ordered){
    const highway=r.kind==='highway',avenue=r.kind==='avenue';
    const w=r.width||(highway?5.25:avenue?1.8:.78),y=highway?.53:.49;
    ribbon(r.points,w+(highway?.48:.4),highway?'#d9cfb8':'#f1ebdc',y-.012,highway);
    const road=ribbon(r.points,w,highway?'#596d70':avenue?'#99a39a':'#b1b7a8',y,highway);
    roads.push({...r,...road,width:w});
    if(highway){
      for(const offset of [-w*.32,-w*.16,w*.16,w*.32])stripe(road.curve,offset,'#e9e8ce',.045,.54,.9,1.15);
      stripe(road.curve,0,'#ead4a2',.07,.542,1.1,.05);
      for(const side of [-1,1]){
        const length=road.length;
        for(let d=.2;d<length;d+=1){const p=road.curve.getPointAt(d/length),v=road.curve.getTangentAt(d/length);const rail=box(world,.12,.28,1.08,'#eee6d3',p.x+v.z*side*(w/2+.1),.66,p.z-v.x*side*(w/2+.1),.03);rail.rotation.y=Math.atan2(v.x,v.z);}
      }
    }else if(avenue)stripe(road.curve,0,'#e6e6cf',.04,.505,.7,1.8);
  }
  for(const railway of MAP.railways||[]){
    const rail=ribbon(railway.points,.8,'#c6c0b0',.467);
    for(let d=.3;d<rail.length;d+=.9){const p=rail.curve.getPointAt(d/rail.length),v=rail.curve.getTangentAt(d/rail.length);const tie=box(world,.77,.025,.1,'#a2977f',p.x,.477,p.z,.01);tie.rotation.y=Math.atan2(v.x,v.z);tie.castShadow=false;}
    for(const side of [-1,1]){const points=[];for(let i=0;i<=60;i++){const p=rail.curve.getPointAt(i/60),v=rail.curve.getTangentAt(i/60);points.push([p.x+v.z*side*.23,p.z-v.x*side*.23]);}ribbon(points,.055,'#6b7973',.487);}
  }
  const highway=roads.find(r=>r.kind==='highway');
  function nearest(point,road=highway){
    let min=Infinity,best=null;const n=Math.ceil(road.length*4);
    for(let i=0;i<=n;i++){const t=i/n,p=road.curve.getPointAt(t),dist=Math.hypot(point.x-p.x,point.z-p.z);if(dist<min){min=dist;best={distance:dist,t,p,tangent:road.curve.getTangentAt(t)};}}
    return best;
  }
  const crossings=[];
  for(const cross of MAP.crossings||[]){
    const q=nearest(cross),tangent=q.tangent;const angle=cross.angle??Math.atan2(-tangent.z,tangent.x);
    const g=group(world,q.p.x,2.0,q.p.z);g.rotation.y=angle;
    const length=8.2,w=cross.width||2.2;
    box(g,w,.24,length,'#d1c5aa',0,.1,0,.08);box(g,w,.08,length+.2,'#f6edda',0,.26,0,.05);
    for(const side of [-1,1]){box(g,.065,.11,length,'#597c6d',side*(w/2-.08),.86,0,.025);for(let z=-length/2;z<=length/2;z+=.75)cyl(g,.025,.025,.58,'#597c6d',side*(w/2-.08),.55,z,5);}
    for(const z of [-7.1,7.1]){const ramp=box(g,w,.1,6.25,'#e6dcc6',0,-.575-.05/Math.cos(.284),z,.04);ramp.rotation.x=Math.sign(z)*.284;}
    crossings.push({...cross,x:q.p.x,z:q.p.z,angle,width:w,length});
  }
  // Populate street furniture only after the fitted landmarks reserve their plots.
  function addContext(reservedPlots){
  const clear=rect=>!reservedPlots.some(plot=>footprintsOverlap(rect,plot,.45));
  const contextColliders=[];
  // Map labels are printed into the diorama, rather than laid over the page.
  for(const label of MAP.labels||[])if(clear({x:label.x,z:label.z,w:label.width||11,d:label.height||.75,rotation:label.rotation||0}))groundLabel(label.text,label.x,label.z,label.width||11,label.height||.75,label.color||'#6c8275',label.background||'#d9dfc5',label.rotation||0);
  for(const r of roads.filter(r=>r.kind==='avenue'&&r.name)){
    const t=r.labelT??.23,p=r.curve.getPointAt(t),v=r.curve.getTangentAt(t);let angle=-Math.atan2(v.z,v.x);if(Math.cos(angle)<0)angle+=Math.PI;
    if(clear({x:p.x,z:p.z,w:Math.min(10,r.length*.3),d:.48,rotation:angle}))groundLabel(r.name.toUpperCase(),p.x,p.z,Math.min(10,r.length*.3),.48,'#6e7c70','#d9dfc5',angle);
  }
  // Quiet context buildings add actual street-block grain without competing
  // with the intentionally oversized portfolio sculptures.
  for(const [i,lot] of (MAP.contextBuildings||[]).entries()){
    const x=lot.x,z=lot.z,w=lot.w||.8,d=lot.d||1.0,h=lot.h||.45;
    const footprint={x,z,w:w+.08,d:d+.08,rotation:lot.rotation||0};if(!clear(footprint))continue;
    const g=group(world,x,.49,z);g.rotation.y=lot.rotation||0;
    box(g,w,h,d,['#e8dfca','#eadfcf','#d0d3c4','#e3d6bf'][i%4],0,h/2,0,.035);
    box(g,w+.08,.09,d+.08,i%5?'#e4d8c1':'#cc9d83',0,h+.04,0,.025);
    contextColliders.push(footprint);
  }
  // A modest compass printed in the model, with real-world orientation supplied by data.
  if(MAP.compass){const c=MAP.compass,g=group(world,c.x,.52,c.z);g.rotation.y=c.rotation||0;box(g,.07,.02,2.5,'#688375',0,.015,0,.02);const tip=mesh(new THREE.ConeGeometry(.28,.7,3),'#688375',g,0,.05,-1.25);tip.rotation.x=-Math.PI/2;groundLabel('N',c.x-Math.sin(c.rotation||0)*2,c.z-Math.cos(c.rotation||0)*2,1,.7);}
  return contextColliders;
  }
  return {roads,highway,waters,crossings,nearest,groundLabel,ribbon,polygon,addContext,bounds:b};
}
