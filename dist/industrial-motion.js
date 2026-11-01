import * as THREE from 'three';
// Art-directed motion for the Blender pumpjack. All coordinates are the asset's
// glTF-local X/Y plane; the model's fitted parent handles its position and scale.
export function createIndustrialMotion(id, group){
  if(id!=='city')return null;
  const find=name=>group.getObjectByName(name);
  const beam=find('pump_beam'),rod=find('pump_polished_rod'),shaft=find('pump_polished_rod_Steel');
  const cranks=['front','back'].map(side=>find(`pump_crank_${side}`));
  const pitmen=['front','back'].map(side=>find(`pump_pitman_${side}`));
  if(!beam||!rod||cranks.some(x=>!x)||pitmen.some(x=>!x))return null;
  const restAngle=Math.atan2(2.12,-.65),restLength=Math.hypot(.65,2.12);
  const crankRadius=.5,beamRadius=2.25,linkLength=2.8;
  // Flexible bridle ropes connect the rocking horsehead to a rod that remains
  // on the fixed wellbore axis. Their endpoints share the rig parent's space.
  const ropeGeometry=new THREE.CylinderGeometry(.027,.027,1,8);
  const ropeMaterial=new THREE.MeshStandardMaterial({color:'#b5c0bd',metalness:.65,roughness:.4});
  const bridles=[-1,1].map(side=>{
    const mesh=new THREE.Mesh(ropeGeometry,ropeMaterial);
    mesh.name=`pump_bridle_${side<0?'front':'back'}`;mesh.castShadow=true;
    rod.parent.add(mesh);return {mesh,side};
  });
  const up=new THREE.Vector3(0,1,0),start=new THREE.Vector3(),end=new THREE.Vector3(),delta=new THREE.Vector3();
  const update=elapsed=>{
    const phase=elapsed*.83;
    // A four-bar linkage: intersect the rear beam's rotation circle with the
    // constant-length pitman circle centered on the turning crank pin.
    const ex=-1.6-crankRadius*Math.sin(phase),ey=1.75+crankRadius*Math.cos(phase);
    const dx=ex,dy=ey-4.5,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d;
    const along=(beamRadius*beamRadius-linkLength*linkLength+d*d)/(2*d);
    const across=Math.sqrt(Math.max(0,beamRadius*beamRadius-along*along));
    const bx=along*ux+across*uy,by=4.5+along*uy-across*ux;
    const theta=Math.atan2(4.5-by,-bx);
    beam.rotation.z=theta;
    cranks.forEach(o=>{o.rotation.z=phase;});
    pitmen.forEach(o=>{
      o.position.x=ex;o.position.y=ey;
      o.rotation.z=Math.atan2(by-ey,bx-ex)-restAngle;
      o.scale.setScalar(linkLength/restLength);
    });
    const headX=3.57*Math.cos(theta)+.82*Math.sin(theta);
    const headY=4.5+3.57*Math.sin(theta)-.82*Math.cos(theta);
    rod.position.x=3.57;rod.position.y=headY-.32;
    // Only the exposed shaft is represented: retract its lower end into the
    // open wellhead sleeve rather than letting a long cylinder pierce the ground.
    if(shaft)shaft.scale.y=(rod.position.y-.8)/3.5;
    bridles.forEach(({mesh,side})=>{
      start.set(headX,headY,side*.17);
      end.set(3.57,rod.position.y-.02,side*.10);
      delta.subVectors(end,start);
      mesh.position.copy(start).add(end).multiplyScalar(.5);
      mesh.scale.y=delta.length();
      mesh.quaternion.setFromUnitVectors(up,delta.normalize());
    });
  };
  update(0);
  return update;
}
