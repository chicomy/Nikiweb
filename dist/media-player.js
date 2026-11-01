import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';

const W=1800,H=1300,PAPER='#f5eed9',MUTED='#adc0b0';
const clock=seconds=>{const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};

// The film itself is a video texture in the city, with physical playback controls.
export function createMediaPlayer(){
  const group=new THREE.Group();group.userData.cinema=true;
  const frame=new THREE.Mesh(new RoundedBoxGeometry(18.4,13.4,.34,2,.14),new THREE.MeshStandardMaterial({color:'#a08b62',roughness:.65}));group.add(frame);
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(18,13),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));face.position.z=.19;group.add(face);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}));screen.position.set(0,-.27,.215);group.add(screen);
  const interactions=[];let makeHits=false;
  function hit(x,y,w,h,action){if(!makeHits)return;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w/100,h/100),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));mesh.position.set((x+w/2-W/2)/100,(H/2-y-h/2)/100,.28);mesh.userData.action=action;group.add(mesh);interactions.push(mesh);}
  const video=document.createElement('video');video.className='media-source';video.playsInline=true;video.preload='metadata';video.volume=.65;video.setAttribute('aria-hidden','true');video.tabIndex=-1;document.body.append(video);
  let item=null,place=null,index=0,total=0,timer=null,posterTexture=null,videoTexture=null,token=0,failed=false,playingRequested=false;
  function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function text(str,x,y,size=28,color=PAPER,font='DM Sans'){ctx.font=`400 ${size}px "${font}", Arial`;ctx.fillStyle=color;ctx.textBaseline='top';ctx.fillText(str,x,y);}
  function wrap(str,x,y,maxWidth,size=48,line=55){ctx.font=`400 ${size}px "Instrument Serif", Georgia`;let row='',yy=y;for(const word of String(str).split(' ')){const next=row?row+' '+word:word;if(ctx.measureText(next).width>maxWidth&&row){text(row,x,yy,size,PAPER,'Instrument Serif');row=word;yy+=line;}else row=next;}text(row,x,yy,size,PAPER,'Instrument Serif');}
  function button(x,w,label,action){round(x,1180,w,66,10,'#3c5c4d');text(label,x+20,1202,24);hit(x-5,1170,w+10,85,action);}
  function fit(width,height){const ratio=(width||16)/(height||9),h=Math.min(7.85,16.35/ratio);screen.scale.set(h*ratio,h,1);}
  function clearHits(){for(const mesh of interactions){group.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}interactions.length=0;}
  function draw(){
    if(!item)return;ctx.fillStyle='#1e3932';ctx.fillRect(0,0,W,H);
    for(let y=288;y<1075;y+=68){round(35,y,20,35,4,'#bba576');round(1745,y,20,35,4,'#bba576');}
    text(`${place.label}  /  ${item.group||'FILM ARCHIVE'}`,80,65,25,'#d5bb82');text(`FILM ${index+1} / ${total}`,1350,66,23,MUTED);
    wrap(item.title,80,121,1490,54,57);text('From Niki’s archive · sound available',82,245,23,MUTED);
    round(1645,51,85,85,42,'#3c5c4d');text('×',1669,59,48);hit(1635,41,105,105,'close');
    round(76,278,1648,798,4,'#10231f');
    const duration=Number.isFinite(video.duration)?video.duration:item.duration||0;
    const ratio=duration?Math.max(0,Math.min(1,video.currentTime/duration)):0;
    text(failed?'Film unavailable · use Play to retry':video.ended?'End of film':video.paused?'Paused · press Space to play':video.readyState<3?'Loading film…':'Now playing',80,1092,23,failed?'#f3b892':MUTED);
    text(`${clock(video.currentTime)} / ${clock(duration)}`,1490,1092,24,MUTED);
    round(82,1140,1634,8,4,'#587162');if(ratio>0)round(82,1140,1634*ratio,8,4,'#d8b26e');
    ctx.fillStyle='#f4dfb4';ctx.beginPath();ctx.arc(82+1634*ratio,1144,11,0,Math.PI*2);ctx.fill();
    for(let n=0;n<100;n++)hit(80+n*16.4,1128,16.4,32,`video-seek:${n/99}`);
    button(80,345,'←  BACK TO ARCHIVE','archive');button(450,180,video.paused?'▶  PLAY':'Ⅱ  PAUSE','video-toggle');
    button(655,120,'−10s','video-back10');button(800,120,'+10s','video-forward10');button(945,235,video.muted?'SOUND OFF':'SOUND ON','video-mute');
    button(1210,220,'←  PREVIOUS','media-item:prev');button(1460,260,'NEXT FILM  →','media-item:next');
    texture.needsUpdate=true;
  }
  function releaseTextures(){screen.material.map=null;posterTexture?.dispose();videoTexture?.dispose();posterTexture=videoTexture=null;}
  function showVideo(){if(!item||failed||video.readyState<2)return;if(!videoTexture){videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;}screen.material.map=videoTexture;screen.material.needsUpdate=true;screen.visible=true;fit(video.videoWidth,video.videoHeight);draw();}
  async function play(){if(!item)return;const current=token;playingRequested=true;if(failed){failed=false;video.load();}try{await video.play();}catch{if(current===token){playingRequested=false;draw();}}}
  function seek(seconds){if(!item||!Number.isFinite(video.duration))return;video.currentTime=Math.max(0,Math.min(video.duration,seconds));draw();}
  for(const event of ['loadedmetadata','timeupdate','play','pause','ended','volumechange','waiting','canplay'])video.addEventListener(event,draw);
  video.addEventListener('loadeddata',showVideo);video.addEventListener('playing',showVideo);
  video.addEventListener('error',()=>{if(item){failed=true;screen.visible=!!posterTexture;screen.material.map=posterTexture;draw();}});
  function close(){token++;item=null;place=null;playingRequested=false;clearInterval(timer);timer=null;video.pause();video.removeAttribute('src');video.load();screen.visible=false;releaseTextures();clearHits();}
  function open(p,i){
    close();place=p;item=p.media[i];const films=p.media.filter(m=>m.type==='video');index=films.indexOf(item);total=films.length;failed=false;const current=++token;
    screen.visible=false;fit(item.width,item.height);video.src=item.src;video.poster=item.poster||item.thumb;video.load();
    if(video.poster)new THREE.TextureLoader().load(video.poster,t=>{if(current!==token){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;posterTexture=t;if(!videoTexture){screen.material.map=t;screen.material.needsUpdate=true;screen.visible=true;fit(item.width,item.height);}},undefined,()=>{});
    makeHits=true;draw();makeHits=false;timer=setInterval(draw,500);play();return{group,interactions};
  }
  function action(name){if(!item||!name.startsWith('video-'))return false;
    if(name==='video-toggle'){video.paused?play():video.pause();}
    if(name==='video-back10')seek(video.currentTime-10);
    if(name==='video-forward10')seek(video.currentTime+10);
    if(name==='video-mute'){video.muted=!video.muted;draw();}
    if(name.startsWith('video-seek:'))seek(Number(name.slice(11))*video.duration);
    return true;
  }
  return {open,close,action,group,interactions,getState:()=>item?{id:item.id,title:item.title,paused:video.paused,muted:video.muted,currentTime:+video.currentTime.toFixed(2),duration:Number.isFinite(video.duration)?+video.duration.toFixed(2):item.duration,readyState:video.readyState,failed}:null,dispose(){close();video.remove();group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});texture.dispose();}};
}
