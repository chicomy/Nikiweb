import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { createThemedExhibits } from './themed-exhibits.js';
import { createMediaExhibit } from './media-exhibit.js';

const W=1800,H=1300,INK='#294638',MUTED='#7a886d',CREAM='#fbf7e8';
export function createExhibit(){
  const group=new THREE.Group();
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const board=new THREE.Mesh(new RoundedBoxGeometry(18.4,13.4,.32,2,.16),new THREE.MeshStandardMaterial({color:'#59745c',roughness:.75}));board.castShadow=true;group.add(board);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(18,13),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));face.position.z=.18;group.add(face);
  const legs=[];for(const x of [-6.5,6.5]){const leg=new THREE.Mesh(new RoundedBoxGeometry(.28,3.7,.32,2,.06),new THREE.MeshStandardMaterial({color:'#8b9b78',roughness:.8}));leg.position.set(x,-8,-.14);group.add(leg);legs.push(leg);}
  const hardware=new THREE.Group();group.add(hardware);
  const metal=new THREE.MeshStandardMaterial({color:'#bdc3b4',metalness:.65,roughness:.38});
  const clip=new THREE.Mesh(new RoundedBoxGeometry(2.6,.43,.20,2,.07),metal);clip.position.set(0,6.34,.32);hardware.add(clip);
  const clipLip=new THREE.Mesh(new RoundedBoxGeometry(1.5,.16,.13,2,.05),metal);clipLip.position.set(0,6.46,.43);hardware.add(clipLip);
  const scrolls=new THREE.Group();group.add(scrolls);for(const x of [-9.03,9.03]){const rod=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,13.75,16),new THREE.MeshStandardMaterial({color:'#a78351',roughness:.65}));rod.position.set(x,0,.25);scrolls.add(rod);}
  function physical(theme){board.material.color.set(theme?.frame||'#59745c');const id=current?.place?.id;hardware.visible=!!theme&&!['culture','arts','golf','divide'].includes(id);scrolls.visible=!!theme&&id==='culture';legs.forEach(l=>l.visible=!theme);}
  const interactions=[];const cache=new Map();let current=null,renderToken=0;
  function remember(src,img){cache.delete(src);cache.set(src,img);while(cache.size>24)cache.delete(cache.keys().next().value);}
  function clearHits(){for(const m of interactions){group.remove(m);m.geometry.dispose();m.material.dispose();}interactions.length=0;}
  function hit(x,y,w,h,action){const m=new THREE.Mesh(new THREE.PlaneGeometry(w/100,h/100),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.position.set((x+w/2-W/2)/100,(H/2-y-h/2)/100,.24);m.userData.action=action;group.add(m);interactions.push(m);}
  function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function text(str,x,y,size=36,color=INK,font='DM Sans',weight=400){ctx.font=`${weight} ${size}px "${font}", Arial, sans-serif`;ctx.fillStyle=color;ctx.textBaseline='top';ctx.fillText(str,x,y);}
  function wrap(str,x,y,maxWidth,size=42,line=58,color=INK,font='DM Sans',weight=400){ctx.font=`${weight} ${size}px "${font}",Arial,sans-serif`;ctx.fillStyle=color;ctx.textBaseline='top';const paragraphs=String(str||'').split('\n');let yy=y;for(const para of paragraphs){let row='';for(const word of para.split(' ')){const next=row?row+' '+word:word;if(ctx.measureText(next).width>maxWidth&&row){ctx.fillText(row,x,yy);yy+=line;row=word;}else row=next;}if(row){ctx.fillText(row,x,yy);yy+=line;}yy+=4;}return yy;}
  function base(color='#728d69'){
    physical(null);clearHits();ctx.clearRect(0,0,W,H);ctx.fillStyle=CREAM;ctx.fillRect(0,0,W,H);ctx.fillStyle=color;ctx.fillRect(0,0,W,15);
    ctx.strokeStyle='#d9dfc9';ctx.lineWidth=2;ctx.strokeRect(36,36,W-72,H-72);
    round(1657,61,77,77,38,'#e9ecd9');text('×',1678,68,52,'#637653');hit(1647,50,98,98,'close');
  }
  function image(src,rect,caption,token,options={}){
    if(!src)return false;
    const paint=img=>{if(token!==renderToken)return;const{x,y,w,h}=rect;ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.clip();if(options.background){ctx.fillStyle=options.background;ctx.fillRect(x,y,w,h);}const scale=(options.contain?Math.min:Math.max)(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*scale)/2,y+(h-img.height*scale)/2,img.width*scale,img.height*scale);ctx.restore();if(options.indicator!==false){round(x+w-63,y+h-63,45,45,9,'#fdf9e7e6');text('↗',x+w-56,y+h-58,32);}wrap(caption||'',x,y+h+22,w,23,32,options.captionColor||MUTED);options.onPaint?.();texture.needsUpdate=true;};
    if(cache.has(src))paint(cache.get(src));else{const img=new Image();img.onload=()=>{remember(src,img);paint(img);};img.src=src;}
    if(options.interactive!==false)hit(rect.x,rect.y,rect.w,rect.h,options.action||'photo');return true;
  }
  function diagram(place,x,y,w,h,options={}){
    round(x,y,w,h,17,'#e8edde');
    if(place.id==='divide'){
      for(const [offset,color] of [[0,'#a9bd91'],[w*.55,'#c9c4a5']])for(let i=0;i<6;i++){const bx=x+30+offset+(i%2)*105,by=y+60+Math.floor(i/2)*130;round(bx,by,78,85,9,color);round(bx+9,by+8,60,16,5,'#f8f3dc');}
      round(x+w*.43,y+25,w*.13,h-50,3,'#617269');ctx.strokeStyle='#eddfad';ctx.lineWidth=4;ctx.setLineDash([12,12]);ctx.beginPath();ctx.moveTo(x+w/2,y+30);ctx.lineTo(x+w/2,y+h-30);ctx.stroke();ctx.setLineDash([]);round(x+140,y+h*.53,w-280,29,5,'#d69d65');
      round(x+w/2-47,y+75,94,95,17,'#f7f5e7');text('101',x+w/2-35,y+102,41,INK,'DM Sans',600);
      text('PLANNING',x+24,y+h-75,23,MUTED,'DM Sans',500);text('OPPORTUNITY',x+w*.55+18,y+h-75,22,MUTED,'DM Sans',500);
    }else if(place.id==='lab'){
      ctx.strokeStyle='#6b9488';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.roundRect(x+66,y+225,180,130,35);ctx.roundRect(x+326,y+225,180,130,35);ctx.stroke();ctx.beginPath();ctx.moveTo(x+246,y+260);ctx.quadraticCurveTo(x+286,y+222,x+326,y+260);ctx.moveTo(x+68,y+250);ctx.lineTo(x+40,y+150);ctx.lineTo(x+120,y+150);ctx.moveTo(x+505,y+250);ctx.lineTo(x+535,y+150);ctx.lineTo(x+455,y+150);ctx.stroke();for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+w/2,y+170,40+i*27,Math.PI*1.22,Math.PI*1.78);ctx.stroke();}text('DESIGN FOR ACCESS',x+95,y+440,28,MUTED,'DM Sans',500);
    }else{
      ctx.fillStyle=place.color||'#98a681';ctx.beginPath();ctx.arc(x+w/2,y+h*.44,110,0,Math.PI*2);ctx.fill();text(place.number||'N',x+w/2-60,y+h*.44-63,124,CREAM,'Instrument Serif');wrap(place.label||'NIKI’S WORLD',x+45,y+h*.72,w-90,31,41,INK,'DM Sans',500);
    }
    wrap(place.id==='divide'?'Illustrative diagram · not measured geography':(place.summary||''),x,y+h+22,w,23,32,options.captionColor||MUTED);
  }
  function footer(page,total){
    ctx.strokeStyle='#d8dfc7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,1150);ctx.lineTo(1720,1150);ctx.stroke();
    round(85,1183,300,66,12,'#e6ebd6');text('←  BACK TO CITY',112,1202,25,'#586f49','DM Sans',500);hit(75,1173,320,85,'close');
    round(435,1183,335,66,12,'#e6ebd6');text('VIEW 3D MODEL  ⤢',459,1203,25,'#586f49','DM Sans',500);hit(425,1173,355,85,'inspect');
    const dotStart=870-total*19;for(let i=0;i<total;i++){ctx.fillStyle=i===page?'#718b5c':'#d4dcc0';ctx.beginPath();ctx.arc(dotStart+i*38,1216,7,0,Math.PI*2);ctx.fill();}
    text(`${page+1} / ${total}`,970,1201,25,MUTED);
    if(page>0){round(1400,1182,115,68,12,'#e6ebd6');text('←',1438,1195,36,INK);hit(1390,1175,130,80,'prev');}
    round(1535,1182,181,68,12,'#3e614d');text(page+1===total?'NEXT PLACE ↗':'NEXT  →',1555,1204,24,'#fff7dc','DM Sans',500);hit(1525,1175,202,80,page+1===total?'next-place':'next');
  }
  function story(place,page=0,visited=false){
    current={mode:'story',place,page};const token=++renderToken,p=place.pages[page];clearHits();const theme=themed.story(place,page,token);if(theme){physical(theme);return{group,interactions};}base(place.color);
    text(`${place.number}   /   ${place.label}`,82,85,28,place.color,'DM Sans',600);text(visited?'DISCOVERED':'FIELD NOTES',1250,89,24,MUTED,'DM Sans',500);
    const titleBottom=wrap(p.title,80,173,1535,78,84,INK,'Instrument Serif');
    const roleY=Math.max(titleBottom+15,282);wrap(place.role,83,roleY,1440,29,39,MUTED);text(place.years,83,roleY+50,25,'#91a17d');
    text(p.eyebrow,84,414,25,place.color,'DM Sans',600);
    const bodyBottom=wrap(p.body,82,465,918,41,57,INK);
    const statsY=Math.max(996,bodyBottom+22);let sx=83;for(const stat of(page===0?(place.stats||[]):[]).slice(0,2)){text(stat.value,sx,statsY,50,place.color,'Instrument Serif');wrap(stat.label,sx,statsY+57,435,23,31,MUTED);sx+=470;}
    if(p.image)image(p.image,{x:1070,y:412,w:645,h:605},p.caption,token);else diagram(place,1070,412,645,605);
    footer(page,place.pages.length);texture.needsUpdate=true;return {group,interactions};
  }
  function photo(place,page=0,index=0){
    current={mode:'photo',place,page};const token=++renderToken,p=place.pages[page],src=index===1&&p.image2?p.image2:p.image,caption=index===1&&p.image2?p.caption2:p.caption;base(place.color);text('A CLOSER LOOK',80,85,28,place.color,'DM Sans',500);text(p.eyebrow,80,144,25,MUTED);
    const draw=img=>{if(token!==renderToken)return;const scale=Math.min(1620/img.width,880/img.height);const ww=img.width*scale,hh=img.height*scale;ctx.drawImage(img,(W-ww)/2,226+(880-hh)/2,ww,hh);texture.needsUpdate=true;};
    if(cache.has(src))draw(cache.get(src));else{const img=new Image();img.onload=()=>{remember(src,img);draw(img);};img.src=src;}
    text(caption||'',80,1150,28,MUTED);round(80,1200,390,65,10,'#e6ebd6');text('←  BACK TO THE STORY',106,1217,26,INK,'DM Sans',500);hit(70,1190,410,85,'photo-back');texture.needsUpdate=true;return{group,interactions};
  }
  function gallery(place,options={}){
    current={mode:'gallery',place,...options};const token=++renderToken;clearHits();const result=mediaExhibit.gallery(place,options,token);physical(result.theme);return{group,interactions,page:result.page,pages:result.pages,count:result.count};
  }
  function mediaPhoto(place,index=0){
    current={mode:'media-photo',place,index};const token=++renderToken;clearHits();physical(mediaExhibit.photo(place,index,token));return{group,interactions};
  }
  function passport(places,quarters,visited){
    current={mode:'passport'};++renderToken;base('#a58a56');text('THE FIELD PASSPORT',80,85,27,'#a58a56','DM Sans',600);text('A city is made of connections.',80,172,80,INK,'Instrument Serif');text('Six neighborhoods. Follow a story, collect a stamp.',85,282,31,MUTED);text(`${visited.size} / ${places.length} PLACES DISCOVERED`,1130,294,25,'#9a9d76','DM Sans',500);
    quarters.forEach((q,i)=>{const x=82+(i%3)*554,y=390+Math.floor(i/3)*346;round(x,y,525,310,13,'#f0f0dd','#dce0c9');ctx.fillStyle=q.color;ctx.fillRect(x+23,y+25,5,31);text(q.name,x+45,y+25,31,INK,'DM Sans',500);q.placeIds.forEach((id,j)=>{const p=places.find(v=>v.id===id),yy=y+93+j*65;const seen=visited.has(id);round(x+22,yy,38,38,19,seen?'#b39157':'#dce3c9');text(seen?'✓':p.number,x+(seen?31:29),yy+8,seen?25:19,seen?'#fff8df':'#84946f','DM Sans',500);text(p.label,x+77,yy+8,23,INK,'DM Sans',500);text('↗',x+471,yy+4,29,'#91a17a');hit(x+14,yy-6,497,55,'place:'+id);});});
    text('A stamp is a story you have visited. There is no right route.',83,1119,27,MUTED);round(82,1185,320,66,11,'#3e614d');text('BACK TO THE CITY  ↗',105,1205,25,'#fff8df','DM Sans',500);hit(72,1175,340,85,'close');round(1260,1185,455,66,11,'#e6ebd6');text('START A FRESH WALK  ↺',1284,1205,24,MUTED,'DM Sans',500);hit(1250,1175,475,85,'reset-passport');texture.needsUpdate=true;return{group,interactions};
  }
  const themed=createThemedExhibits({ctx,W,H,round,text,wrap,hit,image,diagram,texture});
  const mediaExhibit=createMediaExhibit({ctx,W,H,round,text,wrap,hit,image,texture,themes:themed.themes});physical(null);
  return{group,interactions,story,photo,passport,gallery,mediaPhoto,getState:()=>current,dispose(){group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});texture.dispose();}};
}
