import {places,quarters,mapNote} from './city-content.js';
import {createWorld} from './world.js';
import {createExhibit} from './exhibit.js';
import {regionPlaces} from './region-content.js';
import {attachMedia,archiveItems} from './media-library.js';
import {createMediaPlayer} from './media-player.js';
attachMedia(places);
const allPlaces=[...places,...regionPlaces];

const $=s=>document.querySelector(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey='niki-world-passport-v2';
let mediaPlayer,galleryPage=0,mediaFilter='all',mediaIndex=-1;
let visited=new Set(),world,board,active=null,page=0,view='explore',connections=false,paused=matchMedia('(prefers-reduced-motion:reduce)').matches,toastTimer,stateTimer;
try{const data=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(data)){
  // A previous Sports Park visit covered these three chapters together.
  visited=new Set(data.flatMap(id=>id==='sports'?['basketball','golf','football']:[id]).filter(id=>places.some(p=>p.id===id)));
  if(data.includes('sports'))localStorage.setItem(storageKey,JSON.stringify([...visited]));
}}catch{}
$('#accessible-places').innerHTML=quarters.map(q=>`<h2>${escape(q.name)}</h2>${q.placeIds.map(id=>{const p=allPlaces.find(v=>v.id===id);return`<button data-place="${id}">Explore ${escape(p.label)}</button>`;}).join('')}`).join('');
function save(){try{localStorage.setItem(storageKey,JSON.stringify([...visited]));}catch{}syncStamps();}
function syncStamps(){ $('#stamp-count').textContent=`${String(visited.size).padStart(2,'0')} / ${places.length}`;$('#stamp-track').innerHTML=places.map(p=>`<i class="${visited.has(p.id)?'visited':''}"></i>`).join('');world?.setVisited(visited);}
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3600);}
function reading(on){document.body.classList.toggle('reading',on);$('#story-key-guide').hidden=!on;if(on&&view==='passport')$('#story-key-guide').innerHTML='<kbd>Esc</kbd> back to the city';}
function announceStory(p){$('#story-key-guide').innerHTML='<kbd>←</kbd><kbd>→</kbd> turn the page <span>·</span> <kbd>Esc</kbd> back to the city';const s=p.pages[page];$('#accessible-story').innerHTML=`<h2>${escape(p.title)}: ${escape(s.title)}</h2><p>${escape(p.role)}. ${escape(p.years)}</p><p>${escape(s.body)}</p><p>Page ${page+1} of ${p.pages.length}.</p>${s.image?'<button id="accessible-photo">Enlarge photo</button>':''}${s.image2?'<button id="accessible-photo-2">Enlarge second photo</button>':''}${p.media?.length?`<button data-action="archive">Open archive: ${p.media.filter(m=>m.type==='image').length} images and ${p.media.filter(m=>m.type==='video').length} films</button>`:''}<button id="accessible-prev">Previous page</button><button id="accessible-next">${page+1<p.pages.length?'Next page':'Next place'}</button><button id="accessible-inspect">View 3D model</button><button id="accessible-close">Return to city</button>`;}
function openPlace(id){
  const p=allPlaces.find(v=>v.id===id);if(!p||!world)return;
  document.body.classList.remove('inspecting');$('#model-controls').hidden=true;
  mediaPlayer?.close();galleryPage=0;mediaFilter='all';mediaIndex=-1;active=id;page=0;view='story';
  if(!p.context&&!visited.has(id)){visited.add(id);save();toast(visited.size===places.length?'Every place, a different side of Niki. Your field passport is complete.':`New stamp: ${p.label.toLowerCase()} · ${visited.size} of ${places.length} places discovered`);}
  world.focus(id);renderStory();
}
function renderStory(){mediaPlayer?.close();document.body.classList.remove('inspecting');$('#model-controls').hidden=true;const p=allPlaces.find(v=>v.id===active);if(!p)return;view='story';const result=board.story(p,page,visited.has(active));world.setExhibit(result.group,result.interactions,action);reading(true);announceStory(p);syncState();}
function openPassport(){if(!world)return;mediaPlayer?.close();document.body.classList.remove('inspecting');$('#model-controls').hidden=true;active=null;view='passport';world.clearExhibit();world.reset();const result=board.passport(places,quarters,visited);world.setExhibit(result.group,result.interactions,action);reading(true);$('#accessible-story').innerHTML=`<h2>Field passport</h2><p>${visited.size} of ${places.length} places discovered. Explore the city in any order.</p>${quarters.map(q=>`<h3>${q.name}</h3>${q.placeIds.map(id=>`<button data-place="${id}">${allPlaces.find(p=>p.id===id).label}${visited.has(id)?' — discovered':''}</button>`).join('')}`).join('')}<button id="accessible-close">Return to city</button>`;syncState();}
function closeStory(){mediaPlayer?.close();document.body.classList.remove('inspecting');$('#model-controls').hidden=true;world?.clearExhibit();world?.reset();active=null;page=0;view='explore';reading(false);$('#accessible-story').innerHTML='';$('#hint-text').textContent=connections?'Connection study: imagined walking links across 101.':'Follow your curiosity. Click a place to explore.';world?.renderer.domElement.focus({preventScroll:true});syncState();}
function inspectModel(){if(!active)return;mediaPlayer?.close();world.clearExhibit();view='inspect';reading(false);document.body.classList.add('inspecting');$('#model-controls').hidden=false;$('#hint-text').textContent=`${allPlaces.find(p=>p.id===active)?.label} · drag to turn · scroll to zoom`;world.inspect(active);$('#accessible-story').innerHTML='';syncState();}
function openArchive(reset=false){
  const p=allPlaces.find(v=>v.id===active);if(!p?.media?.length)return;
  mediaPlayer?.close();if(reset){galleryPage=0;mediaFilter='all';}
  view='archive';document.body.classList.remove('inspecting');$('#model-controls').hidden=true;reading(true);
  const items=archiveItems(p,mediaFilter),totalPages=Math.max(1,Math.ceil(items.length/6));galleryPage=Math.max(0,Math.min(galleryPage,totalPages-1));
  const result=board.gallery(p,{page:galleryPage,filter:mediaFilter});world.setExhibit(result.group,result.interactions,action);
  $('#accessible-story').innerHTML=`<h2>${escape(p.label)}: Media archive</h2><p>${p.media.filter(m=>m.type==='image').length} images and ${p.media.filter(m=>m.type==='video').length} films. Page ${galleryPage+1} of ${totalPages}.</p><button data-action="media-filter:all">All media</button><button data-action="media-filter:images">Images only</button><button data-action="media-filter:videos">Films only</button>${items.slice(galleryPage*6,galleryPage*6+6).map(({item,index})=>`<button data-action="media-open:${index}">${item.type==='video'?'Play film':'View image'}: ${escape(item.title)}</button>`).join('')}<button data-action="media-page:prev" ${galleryPage===0?'disabled':''}>Previous archive page</button><button data-action="media-page:next" ${galleryPage+1>=totalPages?'disabled':''}>Next archive page</button><button data-action="media-back">Back to field notes</button><button data-action="close">Return to city</button>`;
  $('#story-key-guide').innerHTML='<kbd>←</kbd><kbd>→</kbd> browse the archive <span>·</span> <kbd>Esc</kbd> field notes';syncState();
}
function openMedia(index){
  const p=allPlaces.find(v=>v.id===active),item=p?.media?.[index];if(!item)return;
  mediaPlayer?.close();mediaIndex=index;reading(true);
  const isFilm=item.type==='video';view=isFilm?'video':'media-photo';
  const result=isFilm?mediaPlayer.open(p,index):board.mediaPhoto(p,index);world.setExhibit(result.group,result.interactions,action);
  $('#accessible-story').innerHTML=`<h2>${escape(p.label)}: ${escape(item.title)}</h2><p>${escape(item.caption||item.group||'')}</p>${isFilm?'<button data-action="video-toggle">Play or pause film</button><button data-action="video-back10">Back ten seconds</button><button data-action="video-forward10">Forward ten seconds</button><button data-action="video-mute">Toggle film sound</button>':''}<button data-action="media-item:prev">Previous ${isFilm?'film':'image'}</button><button data-action="media-item:next">Next ${isFilm?'film':'image'}</button><button data-action="archive">Back to archive</button><button data-action="close">Return to city</button>`;
  $('#story-key-guide').innerHTML=isFilm?'<kbd>Space</kbd> play / pause <span>·</span> <kbd>←</kbd><kbd>→</kbd> seek <span>·</span> <kbd>M</kbd> sound <span>·</span> <kbd>Esc</kbd> archive':'<kbd>←</kbd><kbd>→</kbd> browse images <span>·</span> <kbd>Esc</kbd> archive';syncState();
}
function nextMedia(delta){const p=allPlaces.find(v=>v.id===active);if(!p)return;const type=view==='video'?'video':'image';const indices=p.media.map((item,index)=>({item,index})).filter(({item})=>item.type===type).map(v=>v.index);if(!indices.length)return;const pos=indices.indexOf(mediaIndex);openMedia(indices[(pos+delta+indices.length)%indices.length]);}
function action(a){
  if(mediaPlayer?.action(a))return;
  if(a==='archive')return openArchive(view==='story');
  if(a==='media-back')return renderStory();
  if(a.startsWith('media-open:'))return openMedia(Number(a.slice(11)));
  if(a.startsWith('media-filter:')){mediaFilter=a.slice(13);galleryPage=0;return openArchive();}
  if(a==='media-page:prev'){galleryPage=Math.max(0,galleryPage-1);return openArchive();}
  if(a==='media-page:next'){galleryPage++;return openArchive();}
  if(a==='media-item:prev')return nextMedia(-1);
  if(a==='media-item:next')return nextMedia(1);
  if(a==='inspect')return inspectModel();
  if(a.startsWith('place:'))return openPlace(a.slice(6));
  if(a==='reset-passport'){visited.clear();save();openPassport();toast('A fresh walk. Every place is waiting to be discovered again.');return;}
  if(a==='close')return closeStory();
  if(a==='photo-back')return renderStory();
  const p=allPlaces.find(v=>v.id===active);if(!p)return;
  if(a==='prev'){page=Math.max(0,page-1);renderStory();}
  if(a==='next'){page=Math.min(p.pages.length-1,page+1);renderStory();}
  if(a==='next-place'){const list=p.context?regionPlaces:places;openPlace(list[(list.indexOf(p)+1)%list.length].id);}
  if(a==='photo'||a==='photo:2'){
    const index=a==='photo:2'?1:0,s=p.pages[page],src=index?s.image2:s.image;if(!src)return;
    view='photo';$('#story-key-guide').innerHTML='<kbd>Esc</kbd> back to the story';const result=board.photo(p,page,index);world.setExhibit(result.group,result.interactions,action);
    $('#accessible-story').innerHTML=`<h2>${escape(p.label)}: A closer look</h2><p>${escape(index?s.caption2:s.caption)}</p><button id="accessible-photo-back">Back to story</button><button id="accessible-close">Return to city</button>`;syncState();
  }
}
function toggleConnections(){connections=!connections;world?.setConnections(connections);$('#connections-button').setAttribute('aria-pressed',String(connections));$('#connections-button').setAttribute('aria-label',connections?'Hide imagined connections across 101':'Show imagined connections across 101');toast(connections?'Connection study: imagined walking links. These are design possibilities, not findings from the paper.':'Back to the city. Follow the bridges across 101.');syncState();}
function togglePause(){paused=!paused;world?.setPaused(paused);syncPause();}
function syncPause(){$('#pause-button').textContent=paused?'▷':'Ⅱ';$('#pause-button').setAttribute('aria-pressed',String(paused));$('#pause-button').setAttribute('aria-label',paused?'Resume the city':'Pause the city');$('#pause-button').title=paused?'Resume the city':'Pause the city';}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Use your browser’s fullscreen control to expand the world.');}}
function syncState(){if(!world)return;const payload={...world.getState(),view,story:active?{id:active,page:page+1,total:allPlaces.find(p=>p.id===active).pages.length}:null,passport:{collected:visited.size,total:places.length},media:active?{count:allPlaces.find(p=>p.id===active)?.media?.length||0,filter:mediaFilter,page:galleryPage+1,index:mediaIndex,video:mediaPlayer?.getState()}:null,paused};$('#state-json').textContent=JSON.stringify(payload);return payload;}
$('#model-story').addEventListener('click',()=>{world.focus(active);renderStory();});
$('#model-city').addEventListener('click',closeStory);
$('#passport-button').addEventListener('click',()=>view==='passport'?closeStory():openPassport());
$('#connections-button').addEventListener('click',toggleConnections);
$('#reset-button').addEventListener('click',closeStory);
$('#zoom-in').addEventListener('click',()=>world?.zoom(.18));$('#zoom-out').addEventListener('click',()=>world?.zoom(-.18));
$('#pause-button').addEventListener('click',togglePause);$('#fullscreen-button').addEventListener('click',fullscreen);
document.addEventListener('fullscreenchange',()=>$('#fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
document.addEventListener('click',e=>{const control=e.target.closest('[data-action]');if(control){action(control.dataset.action);return;}const p=e.target.closest('[data-place]');if(p)openPlace(p.dataset.place);if(e.target.id==='accessible-close')closeStory();if(e.target.id==='accessible-next'){const entry=allPlaces.find(v=>v.id===active);if(entry)action(page+1<entry.pages.length?'next':'next-place');}if(e.target.id==='accessible-prev')action('prev');if(e.target.id==='accessible-inspect')inspectModel();if(e.target.id==='accessible-photo')action('photo');if(e.target.id==='accessible-photo-2')action('photo:2');if(e.target.id==='accessible-photo-back')action('photo-back');});
window.addEventListener('keydown',e=>{
  if(e.target.matches?.('input,textarea,select')||e.target.isContentEditable||e.repeat)return;
  const k=e.key.toLowerCase();
  if(['archive','media-photo','video'].includes(view)){
    if(k==='escape'){e.preventDefault();view==='archive'?renderStory():openArchive();return;}
    if(view==='archive'&&['arrowleft','arrowright'].includes(k)){e.preventDefault();action(k==='arrowleft'?'media-page:prev':'media-page:next');return;}
    if(view==='media-photo'&&['arrowleft','arrowright'].includes(k)){e.preventDefault();nextMedia(k==='arrowleft'?-1:1);return;}
    if(view==='video'&&[' ','arrowleft','arrowright','m'].includes(k)){e.preventDefault();action({' ':'video-toggle',arrowleft:'video-back10',arrowright:'video-forward10',m:'video-mute'}[k]);return;}
  }
  if(k==='escape'&&view!=='explore'){e.preventDefault();view==='photo'?renderStory():closeStory();}
  if(k==='r'&&view==='inspect'){e.preventDefault();closeStory();}
  if(k==='p'){e.preventDefault();view==='passport'?closeStory():openPassport();}
  if(k==='c'&&view==='explore'){e.preventDefault();toggleConnections();}
  if(k==='f'){e.preventDefault();fullscreen();}
  if(k==='arrowright'&&view==='story'){e.preventDefault();const p=allPlaces.find(p=>p.id===active);action(page+1<p.pages.length?'next':'next-place');}
  if(k==='arrowleft'&&view==='story'){e.preventDefault();action('prev');}
});
$('#accessible-places').insertAdjacentHTML('beforeend','<h2>Palo Alto landmarks</h2>'+regionPlaces.map(p=>`<button data-place="${p.id}">Explore ${p.label}</button>`).join(''));
syncStamps();syncPause();
try{
  await Promise.all([document.fonts.load('78px "Instrument Serif"'),document.fonts.load('400 41px "DM Sans"'),document.fonts.load('600 28px "DM Sans"')]);
  await document.fonts.ready;
  board=createExhibit();mediaPlayer=createMediaPlayer();
  world=await createWorld({container:$('#world-canvas'),places:allPlaces,onSelect:openPlace,onHover:id=>{if(view==='explore'){$('#hint-text').textContent=id?`${allPlaces.find(p=>p.id===id)?.label} · click to discover`:(connections?'Connection study: imagined walking links across 101.':'Follow your curiosity. Click a place to explore.');}},onMove:()=>{},onReady:()=>$('#loading').classList.add('loaded')});
  world.setPaused(paused);world.setVisited(visited);$('#loading').classList.add('loaded');
  stateTimer=setInterval(()=>{const s=syncState();if(view==='explore'&&s?.nearby){const p=allPlaces.find(p=>p.id===s.nearby);$('#hint-text').textContent=`Near ${p.label.toLowerCase()} · press E to explore`; }},250);
  window.render_game_to_text=()=>JSON.stringify(syncState());
  window.advanceTime=ms=>{world.advanceTime(ms);syncState();};
  syncState();
}catch(err){console.error('World initialization failed:',err);$('#loading').classList.add('loaded');$('#world').innerHTML=`<section class="fallback"><h1>Niki's World</h1><p>The 3D city needs a browser with WebGL enabled. All stories are available here.</p>${quarters.map(q=>`<h2>${q.name}</h2>${q.placeIds.map(id=>{const p=allPlaces.find(p=>p.id===id);return`<details><summary>${p.label}</summary>${p.pages.map(s=>`<h3>${escape(s.title)}</h3><p>${escape(s.body)}</p>`).join('')}</details>`;}).join('')}`).join('')}</section>`;document.querySelectorAll('.bottom-hud,.passport-hud,.world-hint').forEach(el=>el.hidden=true);}
window.addEventListener('pagehide',event=>{if(event.persisted)return;clearInterval(stateTimer);clearTimeout(toastTimer);mediaPlayer?.dispose();board?.dispose();world?.dispose();});
