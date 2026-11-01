import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';

// Articulated miniature athletes. Coordinates match the Blender court in metres.
export function createSportsMotion(parent,kind='basketball'){
  if(!['basketball','golf'].includes(kind))return null;
  const isBasketball=kind==='basketball';
  const ensemble=new THREE.Group();ensemble.name=`${kind} athletes in motion`;ensemble.position.set(isBasketball?2.75:-3.15,0,isBasketball?1.125:0);parent.add(ensemble);
  const materials=new Map(),shapes=new Map();
  const mat=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.78}));return materials.get(c);};
  function mesh(geo,c,p,x=0,y=0,z=0){const o=new THREE.Mesh(geo,mat(c));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
  function round(p,w,h,d,c,x=0,y=0,z=0){const key=`b${w},${h},${d}`;if(!shapes.has(key))shapes.set(key,new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.20));return mesh(shapes.get(key),c,p,x,y,z);}
  function ball(p,r,c,x=0,y=0,z=0){const key=`s${r}`;if(!shapes.has(key))shapes.set(key,new THREE.SphereGeometry(r,16,12));return mesh(shapes.get(key),c,p,x,y,z);}
  function group(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
  function rod(p,a,b,r,c){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),dir=w.clone().sub(v);const m=mesh(new THREE.CylinderGeometry(r,r,dir.length(),8),c,p);m.position.copy(v.add(w).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;}
  function athlete(x,z,color,{skin='#c79370',hair='#3e4134',golf=false,number=7}={}){
    const root=group(ensemble,x,.39,z),body=group(root);root.rotation.y=Math.PI;
    round(body,.44,.47,.25,color,0,.91,0);round(body,.43,.19,.27,golf?'#dfd5b6':color,0,.64,0);
    // Jersey hems, a collar, stitched number, shorts and individual sneakers.
    round(body,.45,.045,.26,'#f8edcf',0,.70,0);
    round(body,.21,.045,.27,golf?'#f4eedb':color,0,1.14,0);
    const head=group(body,0,1.34,0);ball(head,.205,skin).scale.set(.87,1,.87);
    ball(head,.206,hair,0,.085,-.025).scale.set(.91,.61,.88);
    for(const side of [-1,1])ball(head,.016,'#263e36',side*.067,.01,.165);
    ball(head,.028,skin,0,-.034,.18).scale.z=.65;
    if(golf){ball(head,.216,color,0,.105,0).scale.y=.47;round(head,.38,.035,.20,color,0,.10,.17);}
    else{
      const c=document.createElement('canvas');c.width=64;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#fff1d5';ctx.font='bold 47px Arial';ctx.textAlign='center';ctx.fillText(String(number),32,51);
      const tex=new THREE.CanvasTexture(c);const badge=new THREE.Mesh(new THREE.PlaneGeometry(.17,.19),new THREE.MeshBasicMaterial({map:tex,transparent:true}));badge.position.set(0,.92,.131);body.add(badge);
    }
    function arm(side){const shoulder=group(body,side*.265,1.08,0);ball(shoulder,.095,color,0,-.03,0);round(shoulder,.125,.28,.13,skin,0,-.17,0);const elbow=group(shoulder,0,-.30,0);ball(elbow,.066,skin);round(elbow,.11,.26,.12,skin,0,-.135,0);const hand=ball(elbow,.077,golf&&side===-1?'#f9efdb':skin,0,-.285,0);return {shoulder,elbow,hand};}
    function leg(side){const hip=group(body,side*.12,.59,0);round(hip,.19,.21,.23,golf?'#dfd5b6':color,0,-.05,0);round(hip,.115,.25,.13,skin,0,-.24,0);const knee=group(hip,0,-.30,0);round(knee,.11,.22,.12,skin,0,-.13,0);round(knee,.13,.11,.14,'#f6efdc',0,-.24,0);const shoe=round(knee,.17,.12,.29,golf?'#40554b':'#f8f0de',0,-.285,.06),sole=round(knee,.18,.035,.30,'#b7bba4',0,-.34,.06);return {hip,knee,shoe,sole};}
    return {root,body,head,left:arm(-1),right:arm(1),legs:[leg(-1),leg(1)]};
  }
  function basketball(){const g=group(ensemble);ball(g,.17,'#c46b31');for(const rot of [[0,0,0],[Math.PI/2,0,0],[0,Math.PI/2,0]]){const m=mesh(new THREE.TorusGeometry(.171,.008,5,32),'#633f26',g);m.rotation.set(...rot);}return g;}
  const dribbler=isBasketball?athlete(-4.05,.70,'#bd644d',{number:4}):null;
  const shooter=isBasketball?athlete(-2.75,-.25,'#d99b5e',{number:11,skin:'#e1b18b'}):null;
  const defender=isBasketball?athlete(-1.18,.15,'#527e7b',{number:3,skin:'#9a684b'}):null;
  const golfer=!isBasketball?athlete(3.40,.62,'#ede1bf',{golf:true,skin:'#c38b6a'}):null;
  const mentor=!isBasketball?athlete(5.22,2.70,'#758f6a',{golf:true,skin:'#e0b28c'}):null;
  if(isBasketball){dribbler.root.rotation.y=-.25;defender.root.rotation.y=.5;}
  else{
    golfer.root.position.y=.48;golfer.root.rotation.y=-Math.PI/2;
    mentor.root.position.y=.48;mentor.root.rotation.y=-2.5;mentor.root.scale.setScalar(.90);
    mentor.left.shoulder.rotation.x=-.5;mentor.left.elbow.rotation.x=-.8;mentor.right.shoulder.rotation.x=-.3;
    golfer.body.rotation.x=.10;golfer.left.shoulder.rotation.x=-.50;golfer.right.shoulder.rotation.x=-.50;golfer.left.shoulder.rotation.z=.43;golfer.right.shoulder.rotation.z=-.43;
  }
  const dribbleBall=isBasketball?basketball():null,shotBall=isBasketball?basketball():null;
  const puttBall=!isBasketball?ball(ensemble,.067,'#fff9e7'):null;
  const club=!isBasketball?group(ensemble):null;
  const clubShaft=club?rod(club,[0,0,0],[0,-1,0],.018,'#a9b3af'):null,clubGrip=club?rod(club,[0,0,0],[0,-1,0],.028,'#41554c'):null;
  const clubFace=club?round(club,.32,.075,.12,'#66756e'):null;
  if(club){club.name='Putter';clubFace.name='Horizontal putter head';}
  const state=isBasketball?{kind,basketball:'dribble and jump shot',shotPhase:0}:{kind,golf:'putting practice',puttPhase:0};
  const ease=t=>t*t*(3-2*t);
  const leftHand=new THREE.Vector3(),rightHand=new THREE.Vector3(),clubHead=new THREE.Vector3(),clubDirection=new THREE.Vector3(),gripCenter=new THREE.Vector3(),gripStart=new THREE.Vector3(),gripEnd=new THREE.Vector3();
  const upAxis=new THREE.Vector3(0,1,0),parkInverse=new THREE.Matrix4(),footCorner=new THREE.Vector3();
  function handInPark(hand,out){hand.getWorldPosition(out);ensemble.worldToLocal(out);return out;}
  // Ground the posed soles, including their rotation and body lean. A fixed root
  // height let the defender's bent legs and dribbler's sway push through the court.
  function groundAthlete(actor,floor,jump=0){
    actor.root.position.y=0;actor.root.updateWorldMatrix(true,true);parkInverse.copy(ensemble.matrixWorld).invert();let lowest=Infinity;
    for(const leg of actor.legs)for(const foot of [leg.shoe,leg.sole]){
      if(!foot.geometry.boundingBox)foot.geometry.computeBoundingBox();const b=foot.geometry.boundingBox;
      for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){footCorner.set(x,y,z).applyMatrix4(foot.matrixWorld).applyMatrix4(parkInverse);lowest=Math.min(lowest,footCorner.y);}
    }
    actor.root.position.y=floor+.008+jump-lowest;actor.root.updateWorldMatrix(false,true);
  }
  function placeShaft(mesh,a,b){clubDirection.copy(b).sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(1,clubDirection.length(),1);mesh.quaternion.setFromUnitVectors(upAxis,clubDirection.normalize());}
  function update(t){
    if(isBasketball){
    const dr=t*Math.PI*2/1.05,bounce=(1+Math.cos(dr))*.5;
    dribbler.right.shoulder.rotation.x=-.55-bounce*.80;dribbler.right.elbow.rotation.x=-.07;dribbler.body.rotation.z=-.06;
    dribbler.legs[0].hip.rotation.x=.14;dribbler.legs[1].hip.rotation.x=-.10;
    groundAthlete(dribbler,.347,Math.max(0,Math.sin(dr))*.015);
    handInPark(dribbler.right.hand,rightHand);dribbleBall.position.set(rightHand.x,.535+bounce*.67,rightHand.z);dribbleBall.rotation.x=t*3.2;
    const cycle=t%4.8,aim=Math.min(cycle/1.25,1),air=Math.max(0,Math.sin(Math.min(cycle/1.8,1)*Math.PI))*.25;
    const armAngle=cycle<1.35?-.9-ease(aim)*1.65:cycle<2.7?-2.55:-2.55+ease(Math.min((cycle-2.7)/1.2,1))*1.65;
    for(const arm of [shooter.left,shooter.right]){arm.shoulder.rotation.x=armAngle;arm.elbow.rotation.x=cycle<1.35?-.7+.6*aim:-.10;}
    groundAthlete(shooter,.347,air);
    if(cycle<1.35){handInPark(shooter.left.hand,leftHand);handInPark(shooter.right.hand,rightHand);shotBall.position.copy(leftHand.add(rightHand).multiplyScalar(.5));shotBall.position.y+=.05;}
    else if(cycle<2.55){const u=(cycle-1.35)/1.2;shotBall.position.set(-2.75,2.25+(2.48-2.25)*u+3.2*u*(1-u),-.55+(-2.93+.55)*u);}
    else if(cycle<3.12){const u=(cycle-2.55)/.57;shotBall.position.set(-2.75,2.48-1.91*u*u,-2.93);}
    else {const u=(cycle-3.12)/1.68;shotBall.position.set(-2.75,.57+Math.abs(Math.sin(u*Math.PI*2))*.42,-2.93+2.45*u);}
    shotBall.rotation.z=t*2;
    defender.root.position.x=-1.18+Math.sin(t*1.3)*.22;defender.body.rotation.z=Math.sin(t*1.3)*.08;
    defender.left.shoulder.rotation.z=-.42;defender.right.shoulder.rotation.z=.42;defender.left.shoulder.rotation.x=-2.1;defender.right.shoulder.rotation.x=-2.1;
    for(const [i,leg]of defender.legs.entries()){leg.hip.rotation.x=Math.sin(t*2+i*Math.PI)*.13;leg.knee.rotation.x=.12;}
    groundAthlete(defender,.347);
    state.shotPhase=+cycle.toFixed(2);
    }else{
    const pc=t%5.6;
    const swing=pc<1?.20*Math.sin(pc*Math.PI):pc<1.5?-.34*Math.sin((pc-1)*Math.PI):pc<3.4?-.27: -.27*(1-Math.min((pc-3.4)/1,1));
    golfer.left.shoulder.rotation.x=-.50+swing*.45;golfer.right.shoulder.rotation.x=-.50+swing*.45;
    groundAthlete(golfer,.407);groundAthlete(mentor,.28);
    handInPark(golfer.left.hand,leftHand);handInPark(golfer.right.hand,rightHand);gripCenter.copy(leftHand).add(rightHand).multiplyScalar(.5);
    const headZ=pc<.85?.72+.18*Math.sin(pc/.85*Math.PI/2):pc<1.25?.90-.34*ease((pc-.85)/.4):pc<3.4?.56:.56+.16*ease(Math.min((pc-3.4)/1.1,1));
    clubHead.set(2.85,.49,headZ);clubFace.position.copy(clubHead);
    // Keep the sole of the putter horizontal; only the shaft follows the hands.
    placeShaft(clubShaft,gripCenter,clubHead);clubDirection.copy(clubHead).sub(gripCenter).normalize();
    gripStart.copy(gripCenter).addScaledVector(clubDirection,-.035);gripEnd.copy(gripCenter).addScaledVector(clubDirection,.20);placeShaft(clubGrip,gripStart,gripEnd);
    // Enter the cup off-center, clearing its flagstick while remaining inside
    // the realistic cup diameter. Ball entry into the cup is intentional.
    if(pc<1.07){puttBall.visible=true;puttBall.position.set(2.85,.48,.58);}
    else if(pc<3.55){const u=(pc-1.07)/2.48;puttBall.visible=true;puttBall.position.set(2.85,.48,.58+(-2.35-.58)*(1-(1-u)*(1-u)));}
    else {puttBall.visible=pc>4.9;puttBall.position.set(2.85,.48,.58);}
    golfer.head.rotation.y=pc>1.2&&pc<4?-.16:0;mentor.head.rotation.y=Math.sin(t*.7)*.12;
    state.puttPhase=+pc.toFixed(2);
    }
  }
  update(0);return {update,state};
}
