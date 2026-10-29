import { districts } from './content.js';

const $ = selector => document.querySelector(selector);
const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  city:'<path d="M5 22V9h22v13M3 23h26M8 12h16M9 15v4m5-4v4m5-4v4m5-4v4M4 9l12-6 12 6"/><path d="M12 23v-4h7v4"/>',
  lab:'<path d="M12 4h8m-6 0v8L6 25h20l-8-13V4M11 18h10"/><circle cx="14" cy="21" r="1"/><path d="M24 7v6m-3-3h6M6 5v4M4 7h4"/>',
  eurus:'<path d="M8 15h16v11H8zM12 15V9h8v6M16 9c-4-2-2-5 0-6 2 2 4 4 0 6M6 26h20"/><path d="M20 21c6-6 9-1 4 1m-4-1v4"/>',
  community:'<path d="M5 13L16 5l11 8v13H5zM3 13h26M13 26v-8h6v8M8 16h2m12 0h2M16 5V2h7l-2 2 2 2h-7"/>',
  sports:'<path d="M16 4v17M16 4l10 4-10 4"/><ellipse cx="16" cy="24" rx="12" ry="4"/><path d="M5 14c3-4 5-3 7-3"/><circle cx="10" cy="22" r="1"/>',
  arts:'<path d="M12 22V7l13-3v15M12 11l13-3"/><ellipse cx="8" cy="23" rx="4" ry="3"/><ellipse cx="21" cy="20" rx="4" ry="3"/>'
};
const subtitles = {city:'Cities & stories',lab:'Ideas for everyone',eurus:'Made with intention',community:'Better, together',sports:'A little team spirit',arts:'Finding my rhythm'};
let city, paused = matchMedia('(prefers-reduced-motion: reduce)').matches, selectedFilter = 'all', photoSet = [], photoIndex = 0;
let activeDistrict = null;

$('#district-grid').innerHTML = districts.map(d => `<button class="district-card" data-district="${d.id}" style="--accent:${d.color}" aria-label="Explore ${d.name}"><span class="district-num">${d.num}</span><span class="district-icon"><svg viewBox="0 0 32 32" aria-hidden="true">${icons[d.id]}</svg></span><span><h3>${d.name}</h3><p>${subtitles[d.id]}</p></span></button>`).join('');

function hoverDistrict(id) {
  document.querySelectorAll('.district-card').forEach(el=>el.classList.toggle('is-hover',el.dataset.district===id));
  const d=districts.find(x=>x.id===id), tooltip=$('#city-tooltip');
  tooltip.hidden=!d;
  if(d) tooltip.innerHTML=`<b>${d.name}</b><span>Explore ↗</span>`;
}
function closeAll() { document.querySelectorAll('dialog[open]').forEach(d=>d.close()); }
function showDialog(dialog) { if(!dialog.open) dialog.showModal(); dialog.scrollTop=0; }
function openDistrict(id) {
  const d=districts.find(x=>x.id===id); if(!d)return;
  activeDistrict=id; city?.focus(id); hoverDistrict(null);
  const next=districts[(districts.indexOf(d)+1)%districts.length];
  if($('#index-dialog').open) $('#index-dialog').close();
  const labArt=`<div class="lab-cover" aria-label="Illustration of navigation glasses"><svg viewBox="0 0 250 160" aria-hidden="true"><path d="M30 65h67q10 0 10 10v24q0 15-15 15H50q-15 0-15-15V75M143 75q0-10 10-10h67l-5 34q0 15-15 15h-42q-15 0-15-15V75M107 80q18-17 36 0M32 69l-17-35h45M220 69l17-35h-45"/><rect x="160" y="73" width="19" height="13" rx="5"/><circle cx="169.5" cy="79.5" r="3"/><path d="M115 39q10-10 20 0M108 29q17-17 34 0M101 19q24-24 48 0" opacity=".5"/><path d="M43 142h164" stroke-dasharray="3 6" opacity=".4"/></svg></div>`;
  $('#detail-content').innerHTML=`<div style="--accent:${d.color}"><div class="drawer-top"><span>${d.num} / THE NEIGHBORHOOD</span><button class="close-button" data-close="detail-dialog" aria-label="Close ${d.name}">×</button></div>${d.cover?`<img class="drawer-cover" src="${d.cover}" alt="${escape(d.gallery[0]?.caption||d.name)}">`:labArt}<div class="drawer-intro"><p class="eyebrow">${d.category}</p><h2 id="detail-title">${d.name}</h2><p class="intro-text">${escape(d.intro)}</p></div><div class="project-list">${d.projects.map(p=>`<article class="project-item"><p class="project-tag">${escape(p.tag)}</p><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p></article>`).join('')}</div>${d.gallery.length?`<section class="gallery-section"><h3 class="section-label">LITTLE MOMENTS, REAL MEMORIES</h3><div class="photo-grid">${d.gallery.map((p,i)=>`<button data-photo="${i}" data-photo-district="${id}" aria-label="View photo: ${escape(p.caption)}"><img src="${p.src}" alt="${escape(p.caption)}" loading="lazy"></button>`).join('')}</div><p class="gallery-note">From my camera roll. Tap a photograph to look a little closer.</p></section>`:''}<button class="next-district" data-district="${next.id}"><div><small>WANDER A LITTLE FURTHER</small><strong>${next.name}</strong></div><span>↗</span></button></div>`;
  showDialog($('#detail-dialog'));
  $('#announcer').textContent=`Opened ${d.name}. ${d.projects.length} experiences.`;
}
function openAbout() {
  activeDistrict=null;
  $('#detail-content').innerHTML=`<div><div class="drawer-top"><span>THE PERSON BEHIND THE PLACES</span><button class="close-button" data-close="detail-dialog" aria-label="Close about Niki">×</button></div><img class="drawer-cover about-photo" src="assets/portrait.jpg" alt="Niki on the golf course"><div class="drawer-intro"><p class="eyebrow" style="color:var(--orange)">HELLO, I'M NIKI LIU</p><h2 id="detail-title">Curiosity has many homes.</h2><p class="intro-text">Cities, people, design, and the spaces in between.</p></div><div class="about-values"><span>Curious observer</span><span>Thoughtful maker</span><span>Team player</span></div><div class="about-body"><p>My interests don't fit neatly into one building. They take me from conversations with oil workers in Daqing to a design studio, from a community classroom to a golf course, and from a rehearsal room to the stage.</p><p>This neighborhood brings those experiences together. Each building opens a different chapter: a question explored, something made, or a moment shared with other people.</p><p>Take your time. Follow whatever catches your eye.</p><button class="primary-button" id="about-explore">Explore my experiences <span>↗</span></button></div></div>`;
  showDialog($('#detail-dialog'));
}
function renderIndex(){
  const query=$('#project-search').value.toLowerCase().trim();
  const matches=districts.flatMap(d=>d.projects.map(p=>({d,p}))).filter(({d,p})=>(selectedFilter==='all'||selectedFilter===d.id)&&`${d.name} ${p.title} ${p.tag} ${p.description}`.toLowerCase().includes(query));
  $('#index-results').innerHTML=matches.length?matches.map(({d,p})=>`<button class="index-project" data-district="${d.id}" style="--accent:${d.color}"><small><i></i>${d.name} <span>↗</span></small><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p></button>`).join(''):'<p class="index-empty">No chapters found. Try another word or neighborhood.</p>';
  $('#announcer').textContent=`${matches.length} experiences found.`;
}
function openIndex(){
  if($('#detail-dialog').open)$('#detail-dialog').close();
  $('#project-search').value=''; selectedFilter='all';
  $('#index-filters').innerHTML=`<button class="filter-button selected" data-filter="all">All neighborhoods</button>`+districts.map(d=>`<button class="filter-button" data-filter="${d.id}">${d.name}</button>`).join('');
  renderIndex(); showDialog($('#index-dialog'));
}
function showPhoto(index){
  photoIndex=(index+photoSet.length)%photoSet.length;
  const p=photoSet[photoIndex]; $('#lightbox-image').src=p.src; $('#lightbox-image').alt=p.caption;
  $('#lightbox-caption').textContent=`${p.caption} · ${photoIndex+1} / ${photoSet.length}`;
}
document.addEventListener('click',event=>{
  const district=event.target.closest('[data-district]'); if(district){openDistrict(district.dataset.district);return;}
  const close=event.target.closest('[data-close]'); if(close){$('#'+close.dataset.close).close();return;}
  const photo=event.target.closest('[data-photo]'); if(photo){photoSet=districts.find(x=>x.id===photo.dataset.photoDistrict).gallery;showPhoto(Number(photo.dataset.photo));showDialog($('#lightbox'));return;}
  const filter=event.target.closest('[data-filter]'); if(filter){selectedFilter=filter.dataset.filter;document.querySelectorAll('.filter-button').forEach(b=>b.classList.toggle('selected',b===filter));renderIndex();}
  if(event.target.closest('#about-explore'))openIndex();
});
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{if(dialog.id==='detail-dialog'){activeDistrict=null;city?.reset();}});
});
$('#about-button').addEventListener('click',openAbout);
$('#nav-index').addEventListener('click',openIndex);
$('#nav-explore').addEventListener('click',()=>{closeAll();city?.reset();});
$('.wordmark').addEventListener('click',event=>{event.preventDefault();closeAll();city?.reset();});
$('#explore-button').addEventListener('click',()=>openDistrict('city'));
$('#reset-view').addEventListener('click',()=>city?.reset());
$('#zoom-in').addEventListener('click',()=>city?.zoom(0.15));
$('#zoom-out').addEventListener('click',()=>city?.zoom(-0.15));
const pauseButton=$('#pause-motion');
function syncPause(){pauseButton.textContent=paused?'▷':'Ⅱ';pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.setAttribute('aria-label',paused?'Resume animation':'Pause animation');pauseButton.title=paused?'Resume animation':'Pause animation';}
syncPause();
pauseButton.addEventListener('click',()=>{paused=!paused;city?.setPaused(paused);syncPause();});
$('#project-search').addEventListener('input',renderIndex);
$('#photo-prev').addEventListener('click',()=>showPhoto(photoIndex-1));
$('#photo-next').addEventListener('click',()=>showPhoto(photoIndex+1));
$('#lightbox').addEventListener('keydown',event=>{if(event.key==='ArrowLeft')showPhoto(photoIndex-1);if(event.key==='ArrowRight')showPhoto(photoIndex+1);});
try {
  const {createCity}=await import('./city.js');
  city=await createCity({container:$('#city-canvas'),onSelect:openDistrict,onHover:hoverDistrict,onReady:()=>$('#city-loader').classList.add('loaded')});
  city.setPaused(paused);
  $('#city-loader').classList.add('loaded');
} catch(error) {
  console.error('The city could not be rendered:',error);
  $('#city-loader').classList.add('loaded');
  $('#city-canvas').innerHTML='<div class="fallback-message"><b>A world of experiences.</b><p>The 3D neighborhood needs a WebGL-enabled browser.<br>Every chapter is still waiting in the cards below.</p></div>';
  $('.city-instructions').hidden=true; $('.view-controls').hidden=true;
}
window.addEventListener('pagehide',()=>city?.dispose());
