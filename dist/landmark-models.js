// Sculptural portfolio destinations. All coordinates are local to the landmark group.
// Each place reads as its subject before a visitor reads its label.
export function buildLandmarkModel(id, g, h) {
  const { THREE, P, box, cyl, ball, group, mesh, sign, roof, tree, bench, windBits = [] } = h;
  const cream=P.cream, deep=P.deep, coral=P.coral, gold='#e8ba60';
  const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.72,...extra});
  function torus(parent,r,t,color,x,y,z,rotation=[0,0,0]){const m=mesh(new THREE.TorusGeometry(r,t,7,36),color,parent,x,y,z);m.rotation.set(...rotation);return m;}
  function path(parent,points,r,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,Math.max(14,points.length*6),r,7,false),color,parent);}
  function extrude(parent,shape,depth,color,x=0,y=0,z=0,bevel=.08){return mesh(new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:18,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3}),color,parent,x,y,z);}
  function disk(r=3.7,c=P.stone){cyl(g,r,r+.08,.18,c,0,.08,0,48);}
  function label(text,w=4.4,z=3.25,bg=cream){const b=box(g,w+.25,.57,.18,bg,0,.46,z,.08);sign(g,text,w,.38,0,.47,z+.1,bg,deep);return b;}
  function leaf(parent,x,y,z,size=.4,rot=0){const m=ball(parent,size,'#83aa72',x,y,z);m.scale.set(.6,1.3,.28);m.rotation.z=rot;return m;}
  function heartShape(s=1){const a=new THREE.Shape();a.moveTo(0,-.7*s);a.bezierCurveTo(-1.5*s,.2*s,-1.25*s,1.35*s,-.5*s,1.2*s);a.bezierCurveTo(-.17*s,1.18*s,0,.8*s,0,.8*s);a.bezierCurveTo(0,.8*s,.17*s,1.18*s,.5*s,1.2*s);a.bezierCurveTo(1.25*s,1.35*s,1.5*s,.2*s,0,-.7*s);return a;}
  function flag(parent,x,y,z,height=1.6){cyl(parent,.025,.025,height,cream,x,y+height/2,z,6);box(parent,.6,.36,.025,coral,x+.3,y+height-.2,z,.025);}
  function flame(parent,x,y,z,size=1){const f=group(parent,x,y,z);f.scale.setScalar(size);const points=[[0,0],[.24,.06],[.38,.27],[.4,.52],[.29,.82],[.12,1.14],[0,1.5]].map(p=>new THREE.Vector2(...p));const m=mesh(new THREE.LatheGeometry(points,24),material('#f6b447',{emissive:'#ef8c27',emissiveIntensity:.48}),f);m.rotation.z=-.13;const core=ball(f,.25,material('#ffe7a5',{emissive:'#ffd173',emissiveIntensity:.6}),0,.35,.16);core.scale.set(.75,1.65,.6);windBits.push(f);return f;}
  function candle(parent,x,z,r,height,color){cyl(parent,r,r,height,color,x,height/2+.25,z,40);cyl(parent,r*.92,r*.92,.08,'#fff0ce',x,height+.28,z,40);torus(parent,r*.93,.09,color,x,height+.29,z,[Math.PI/2,0,0]);for(let i=0;i<7;i++){const angle=i*.9+.2,len=.22+(i%3)*.25;const drop=ball(parent,r*.16,color,x+Math.sin(angle)*r*.96,height+.1-len/2,z+Math.cos(angle)*r*.96);drop.scale.set(.85,len/(r*.16)+.35,.55);}cyl(parent,.035,.035,.3,deep,x,height+.46,z,7);flame(parent,x,height+.54,z,r*.7);}
  function curtain(parent,x,width,height,z){for(let i=0;i<5;i++){const xx=x+(i-2)*width/5;cyl(parent,width/5*.6,width/5*.63,height,'#a84747',xx,height/2+.65,z,12);}box(parent,width+.1,.5,.45,'#c15955',x,height+.62,z,.2);}

  if(id==='eurus') {
    disk(3.8,'#c49c70');cyl(g,3.55,3.6,.16,'#e9d2a8',0,.23,0,48);torus(g,3.5,.14,'#bd8f64',0,.35,0,[Math.PI/2,0,0]);
    candle(g,-.65,-.35,1.48,4.3,'#e6b3a3');candle(g,1.9,.75,.88,2.55,'#ead08f');candle(g,-2.15,1.25,.65,1.6,'#a5bca0');
    // Reused-glass candle vessel and leaves make the sustainability story part of the sculpture.
    torus(g,1.5,.1,'#f5dfc4',-.65,.45,-.35,[Math.PI/2,0,0]);
    for(const [x,z,rotation]of[[2.6,-1.2,-.65],[2.2,-1.55,.65],[-2.5,-1.4,-.7]])leaf(g,x,.58,z,.48,rotation);
    label('EUROS · LIGHT WITH PURPOSE',5.4,3.35,'#eddbb8');return {markerHeight:7.6,collider:{w:7.5,d:7.1}};
  }
  if(id==='arts') {
    // An open proscenium: a white vaulted shell, velvet curtains and a real tiny audience.
    box(g,7.8,.32,6.6,P.lilac,0,.2,.1,.7);box(g,6.55,.2,3.9,'#bd916c',0,.46,-.8,.4);
    const arch=new THREE.Shape();arch.moveTo(-3.65,.65);arch.lineTo(-3.65,2.2);arch.bezierCurveTo(-3.65,6.4,3.65,6.4,3.65,2.2);arch.lineTo(3.65,.65);arch.lineTo(3.03,.65);arch.lineTo(3.03,2.2);arch.bezierCurveTo(3.03,5.54,-3.03,5.54,-3.03,2.2);arch.lineTo(-3.03,.65);arch.closePath();extrude(g,arch,3.1,cream,0,0,-2.4,.1);
    box(g,5.95,3.25,.12,'#482e48',0,2.2,-2.35,.15);curtain(g,-2.45,1.15,3.25,.8);curtain(g,2.45,1.15,3.25,.8);box(g,5.7,.6,.44,'#a84747',0,4.2,.8,.22);
    // Scalloped swags and a glowing apron of stage footlights.
    for(let i=0;i<5;i++){const swag=ball(g,.61,'#b95151',-2.25+i*1.12,3.92,.86);swag.scale.set(1,.48,.42);}for(let i=0;i<10;i++)ball(g,.075,'#ffe1a0',-2.5+i*.56,.7,1.13);
    const moon=cyl(g,.65,.65,.08,'#eedbaa',0,3,-2.2,32);moon.rotation.x=Math.PI/2;
    for(let row=0;row<2;row++)for(let col=0;col<7;col++){const seat=group(g,-2.55+col*.85,.3,1.6+row*.8);box(seat,.58,.18,.49,'#9d5f76',0,.3,0,.08);box(seat,.58,.58,.15,'#9d5f76',0,.51,.25,.09);}
    box(g,5.3,.78,.32,deep,0,4.98,1.02,.18);sign(g,'THE PLAYHOUSE',4.8,.47,0,5,1.2,deep,cream);for(let i=0;i<15;i++)ball(g,.045,gold,-2.4+i*.344,4.68,1.22);
    return {markerHeight:7.5,collider:{w:7.8,d:6.6}};
  }
  if(id==='council') {
    disk(3.7,'#ded0af');
    const violin=new THREE.Shape();violin.moveTo(0,-1.7);violin.bezierCurveTo(-2,-1.65,-2.05,.1,-1,.55);violin.bezierCurveTo(-.45,.9,-1.7,1.15,-1.25,2.2);violin.bezierCurveTo(-.75,3.1,.75,3.1,1.25,2.2);violin.bezierCurveTo(1.7,1.15,.45,.9,1,.55);violin.bezierCurveTo(2.05,.1,2,-1.65,0,-1.7);
    const vg=group(g,-.3,2.2,-.3);vg.rotation.z=-.13;extrude(vg,violin,.85,'#b9734d',0,0,-.4,.13);extrude(vg,violin,.06,'#d49869',0,0,.47,.05);
    box(vg,.33,3.3,.28,'#493d37',0,3.15,.63,.08);box(vg,.7,.22,.3,'#8c5c40',0,4.58,.65,.09);for(const xx of [-.34,.34])for(const yy of [4.1,4.4])ball(vg,.12,'#493d37',xx,yy,.65);
    box(vg,.7,.18,.25,cream,0,.26,.77,.03);box(vg,.46,.8,.2,'#493d37',0,-.88,.72,.1);for(const xx of [-.09,-.03,.03,.09])path(vg,[[xx,-1,.88],[xx,4.47,.9]],.012,'#f5dfae');
    for(const side of [-1,1])path(vg,[[side*.69,1.05,.65],[side*.49,.85,.68],[side*.79,.36,.68],[side*.68,.1,.65]],.06,'#674530');
    const bow=group(g,2.25,2.6,-.2);bow.rotation.z=-.3;box(bow,.09,5.4,.09,'#775840',0,0,0,.04);box(bow,.025,5,.04,cream,-.18,.08,0,.01);box(bow,.4,.24,.15,deep,-.08,-2.55,0,.04);
    // The forecourt is a playable-looking piano keyboard, not a storefront awning.
    box(g,6.8,.22,1.7,deep,0,.3,2.15,.18);for(let i=0;i<14;i++)box(g,.45,.16,1.5,cream,-3.08+i*.475,.48,2.15,.025);for(let i=0;i<13;i++)if(![2,6,9].includes(i))box(g,.25,.15,.9,deep,-2.84+i*.475,.62,1.84,.025);
    label('MUSIC STUDIO',3.6,3.24);return {markerHeight:8,collider:{w:7.4,d:6.9}};
  }
  if(id==='lab') {
    box(g,7.4,.25,6.1,'#92b7aa',0,.15,0,.8);box(g,6.8,.14,5.5,'#dbe8d5',0,.34,0,.65);
    // Two giant lenses are the architecture; curved temples become structural side wings.
    const glasses=group(g,0,3.25,-.25);
    for(const x of [-1.75,1.75]){const shape=new THREE.Shape();shape.absellipse(0,0,1.55,1.23,0,Math.PI*2,false,0);const hole=new THREE.Path();hole.absellipse(0,0,1.25,.93,0,Math.PI*2,true,0);shape.holes.push(hole);extrude(glasses,shape,.42,deep,x,0,0,.09);const lens=mesh(new THREE.CircleGeometry(1,40),material('#87c2ca',{transparent:true,opacity:.48,metalness:.1}),glasses,x,0,.2);lens.scale.set(1.23,.92,1);box(g,.35,2.3,.35,deep,x,1.4,.2,.15);}
    path(glasses,[[-.28,.1,.23],[0,.36,.23],[.28,.1,.23]],.17,deep);for(const side of [-1,1])path(glasses,[[side*3.2,.3,.2],[side*3.5,.28,-.45],[side*3.45,-.1,-2.1],[side*3.08,-.38,-2.45]],.17,deep);
    box(glasses,.58,.5,.55,P.coral,-3.18,.25,-.1,.14);cyl(glasses,.16,.16,.06,'#243c40',-3.18,.25,.22,20).rotation.x=Math.PI/2;
    box(g,3.7,.5,2.4,cream,0,.65,0,.25);sign(g,'FEEL TO READ',3.4,.5,0,1.2,1.24,cream);for(let i=0;i<7;i++)cyl(g,.14,.14,.035,gold,(-1.8+i*.6),.45,2.25,12);for(const x of [-2.6,2.6])box(g,.85,.4,.85,P.mint,x,.6,1.75,.14);
    return {markerHeight:6.6,collider:{w:7.5,d:6.2}};
  }
  if(id==='city') {
    box(g,7.8,.25,6.1,'#ceb89b',0,.15,0,.6);
    // The cinema is a monumental film reel: its outline remains legible at map scale.
    const reel=cyl(g,2.45,2.45,2.3,'#bc7055',-.65,2.8,-.55,48);reel.rotation.x=Math.PI/2;
    const face=cyl(g,2.25,2.25,.18,'#ead6ae',-.65,2.8,.68,48);face.rotation.x=Math.PI/2;torus(g,2.17,.1,'#a3644e',-.65,2.8,.81);torus(g,.43,.12,'#a3644e',-.65,2.8,.87);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const hole=cyl(g,.58,.58,.06,'#584f42',-.65+Math.sin(a)*1.29,2.8+Math.cos(a)*1.29,.82,28);hole.rotation.x=Math.PI/2;}
    box(g,5.7,.8,.5,deep,-.4,1.27,2,.12);sign(g,'RISE & DECLINE',5.2,.52,-.4,1.29,2.26,deep,cream);for(let i=0;i<14;i++)ball(g,.055,gold,-2.9+i*.385,.98,2.28);
    // A small pumpjack carries the Daqing oil-city story directly into the model.
    const pump=group(g,2.4,.36,-1.2);for(const x of [-.58,.58]){box(pump,.15,2.8,.17,deep,x,1.3,0,.035).rotation.z=x<0?-.25:.25;}cyl(pump,.18,.18,.6,deep,0,2.6,0,12).rotation.x=Math.PI/2;const beam=box(pump,2.2,.25,.3,deep,0,2.78,0,.07);beam.rotation.z=.18;box(pump,.5,.95,.4,deep,1.1,2.5,0,.15).rotation.z=.2;path(pump,[[1.28,2.6,.12],[1.28,.3,.12]],.035,deep);box(pump,1.6,.4,1,P.orange,0,.24,0,.08);
    for(let i=0;i<3;i++)box(g,5.8+i*.3,.12,.42,P.stone,-.4,.3-i*.07,2.5+i*.35,.03);
    return {markerHeight:7.4,collider:{w:7.8,d:6.8}};
  }
  if(id==='culture') {
    disk(3.8,'#d7bd8e');const pavilion=group(g,-1.2,.15,-.25);for(const x of [-1.5,1.5])for(const z of [-1.25,1.25])cyl(pavilion,.14,.17,2.55,coral,x,1.3,z,12);
    // Stacked hipped roofs and flying corners, paired with an oversized brush and inkstone.
    for(const [y,s]of[[2.7,1],[3.5,.72]]){const r=mesh(new THREE.ConeGeometry(2.55*s,.9,4),deep,pavilion,0,y,0);r.rotation.y=Math.PI/4;r.scale.z=.85;for(const x of [-1.7,1.7])for(const z of [-1.45,1.45])path(pavilion,[[x*s,y-.35,z*s],[x*1.17*s,y-.23,z*1.16*s]],.08,deep);}
    const brush=group(g,2,.45,-.1);brush.rotation.z=-.2;cyl(brush,.17,.25,3.6,'#9e7251',0,3.05,0,16);cyl(brush,.3,.28,.55,gold,0,1.12,0,16);const tip=mesh(new THREE.ConeGeometry(.3,1.1,18),deep,brush,0,.36,0);tip.rotation.z=Math.PI;cyl(brush,.18,.18,.18,deep,0,4.95,0,16);torus(brush,.22,.04,deep,0,5.22,0);
    const stone=box(g,1.6,.35,1.3,'#52635a',2,.3,.8,.35);box(g,1.05,.05,.7,'#253d38',2,.49,.8,.23);
    const scroll=group(g,-.3,.4,2.3);box(scroll,4.8,.06,1.25,cream,0,0,0,.05);for(const x of [-2.4,2.4]){const roll=cyl(scroll,.13,.13,1.5,P.orange,x,.04,0,12);roll.rotation.x=Math.PI/2;}for(let i=0;i<4;i++)path(scroll,[[-1.5+i*.8,.06,-.35],[-1.35+i*.8,.06,.24],[-1.05+i*.8,.06,.07]],.04,deep);
    for(const x of [-2.6,.2]){cyl(g,.02,.02,.4,deep,x,2.15,1.1,6);ball(g,.27,coral,x,1.8,1.1).scale.y=1.25;}return {markerHeight:7,collider:{w:7.5,d:6.5}};
  }
  if(id==='daycare') {
    box(g,7.7,.23,6.5,'#b2c88e',0,.13,0,.8);
    // An open picture book becomes the shelter, with an alphabet-block playground.
    const book=group(g,0,.45,-.8);for(const side of [-1,1]){const page=group(book,side*1.45,0,0);page.rotation.z=side*-.17;box(page,2.95,3.45,.35,side<0?'#eacb84':'#a9ccbc',0,1.7,0,.22);box(page,2.63,3.1,.07,cream,0,1.72,.22,.16);cyl(page,.42,.42,.035,P.yellow,side*-.45,2.52,.29,20).rotation.x=Math.PI/2;for(let i=0;i<3;i++)box(page,1.55,.075,.04,'#a9b99a',0,1.6-i*.32,.29,.02);}
    box(book,.2,3.35,.42,P.coral,0,1.68,0,.08);box(g,5.9,.14,1.8,'#ded2a9',0,.37,.9,.35);
    for(const [x,z,c,t]of[[-2.5,1.8,P.coral,'A'],[-1.5,2.6,P.blue,'B'],[-.35,2,P.yellow,'C']]){box(g,.9,.9,.9,c,x,.75,z,.15);sign(g,t,.65,.65,x,.76,z+.47,c,cream);}
    const swing=group(g,2.1,.28,1.7);for(const side of [-1,1]){box(swing,.09,1.85,.1,deep,side*.87,.95,-.35,.03).rotation.x=-.2;box(swing,.09,1.85,.1,deep,side*.87,.95,.4,.03).rotation.x=.2;}box(swing,2,.12,.12,P.coral,0,1.9,0,.04);for(const x of [-.3,.3])cyl(swing,.015,.015,1.2,deep,x,1.2,0,5);box(swing,.85,.12,.5,P.yellow,0,.59,0,.06);
    return {markerHeight:6.3,collider:{w:7.7,d:6.5}};
  }
  if(id==='wellness') {
    disk(3.6,'#b9cc9c');
    const heart=extrude(g,heartShape(1.9),1.2,'#d88781',0,2.5,-1.45,.15);const inset=extrude(g,heartShape(1.58),.08,'#f1c9b0',0,2.5,-.17,.08);
    // A sheltered circular bench and greenhouse make this a place of care and company.
    box(g,2.3,1.75,.08,deep,0,1.24,.02,.35);for(const side of [-1,1])box(g,.9,1.3,.09,'#a7c8be',side*1.8,1.5,-.05,.28);
    cyl(g,1.6,1.7,.25,cream,0,.3,1.8,40);torus(g,1.3,.18,P.orange,0,.72,1.8,[Math.PI/2,0,0]);cyl(g,.5,.55,.36,P.stone,0,.75,1.8,24);ball(g,.62,'#8ea96f',0,1.2,1.8).scale.y=.45;
    for(const [x,z]of[[-2.7,.7],[2.7,.7]]){cyl(g,.5,.37,.5,P.cream,x,.5,z,16);leaf(g,x,1,z,.43,-.35);leaf(g,x+.22,1.1,z,.36,.4);}
    return {markerHeight:6.7,collider:{w:7.2,d:6.8}};
  }
  if(id==='civic') {
    disk(3.85,'#d6c5a3');cyl(g,2.65,2.8,.45,P.stone,0,.35,-.35,40);cyl(g,2.4,2.4,2.35,'#e4d6b5',0,1.7,-.35,32);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;cyl(g,.16,.21,2.5,cream,Math.sin(a)*2.68,1.82,-.35+Math.cos(a)*2.68,16);cyl(g,.27,.27,.15,cream,Math.sin(a)*2.68,3.1,-.35+Math.cos(a)*2.68,16);}
    cyl(g,2.95,3,.23,cream,0,3.3,-.35,40);const dome=mesh(new THREE.SphereGeometry(2.55,32,18,0,Math.PI*2,0,Math.PI/2),P.mint,g,0,3.44,-.35);dome.scale.y=.6;cyl(g,.13,.16,.8,gold,0,5.15,-.35,12);ball(g,.21,gold,0,5.58,-.35);
    box(g,1.3,1.9,.12,deep,0,1.45,2.05,.2);for(let i=0;i<3;i++)box(g,3.4+i*.45,.13,.55,P.stone,0,.4-i*.08,2.4+i*.4,.05);label('CIVIC HALL',3.5,3.58);return {markerHeight:7.5,collider:{w:7.8,d:7}};
  }
  if(id==='basketball') {
    box(g,6.7,.22,6.55,'#9bb782',0,.12,0,.4);box(g,5.2,.05,5.675,'#c89172',0,.28,0,.1);
    for(const x of [-2.35,2.35])box(g,.035,.015,5.15,cream,x,.32,0,.005);
    for(const z of [-2.575,2.575])box(g,4.7,.015,.035,cream,0,.32,z,.005);
    box(g,1.65,.015,1.95,'#719a8c',0,.33,-1.5,.03);cyl(g,.075,.075,2.3,deep,0,1.56,-2.275,12);
    box(g,1.18,.72,.07,cream,0,2.69,-2.15,.03);torus(g,.29,.031,coral,0,2.48,-1.805,[Math.PI/2,0,0]);
    label('BASKETBALL COURT',5,3);return {markerHeight:4.5,collider:{w:6.7,d:6.55}};
  }
  if(id==='golf') {
    box(g,5.7,.22,8.3,'#9bb782',0,.12,0,.4);box(g,4.6,.12,7.5,'#719e69',0,.28,0,1.3);
    box(g,1.45,.04,2.1,'#e6d4a1',.9,.37,1.75,.65);cyl(g,.17,.17,.02,deep,-.4,.36,-2.35,20);flag(g,-.4,.4,-2.35,1.65);
    ball(g,.067,cream,-.3,.48,.58);label('GOLF GREEN',4.6,3.9);return {markerHeight:3.9,collider:{w:5.7,d:8.3}};
  }
  if(id==='football') {
    box(g,7.8,.22,5.5,'#9bb782',0,.12,0,.4);box(g,7,.05,4.6,'#719e69',0,.28,0,.05);
    for(const z of [-2.1,2.1])box(g,6.7,.015,.035,cream,0,.32,z,.005);
    for(const x of [-3.35,0,3.35])box(g,.035,.015,4.2,cream,x,.32,0,.005);
    const ring=mesh(new THREE.RingGeometry(.62,.65,32),new THREE.MeshBasicMaterial({color:cream,side:THREE.DoubleSide}),g,0,.33,0);ring.rotation.x=-Math.PI/2;
    for(const x of [-3.45,3.45]){for(const z of [-.75,.75])cyl(g,.035,.035,.95,cream,x,.8,z,8);box(g,.065,.065,1.55,cream,x,1.27,0,.015);}
    label('FOOTBALL FIELD',4.6,2.55);return {markerHeight:3.3,collider:{w:7.8,d:5.5}};
  }
  if(id==='divide') {
    for(const x of [-4.3,4.3]){box(g,.3,5.8,.4,deep,x,2.9,0,.1);box(g,1,.22,1,cream,x,.11,0,.12);}box(g,9.2,.35,.5,deep,0,5.68,0,.1);box(g,7.4,1.8,.32,deep,0,4.93,.2,.15);sign(g,'DIVIDED BY 101',6.9,.72,0,5.18,.38,deep,cream);sign(g,'HOW DOES A ROAD SHAPE A CITY?',6.8,.4,0,4.55,.38,deep,'#c8dac1');return {markerHeight:7.5,collider:null};
  }
  return {markerHeight:6,collider:{w:7,d:6}};
}
