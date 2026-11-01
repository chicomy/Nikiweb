// A local contact sheet and full-size photograph viewer, kept inside each landmark.
export function createMediaExhibit({ctx,W,H,round,text,wrap,hit,image,texture,themes}){
  const fallback={bg:'#f5efde',ink:'#304f40',muted:'#7d8c74',accent:'#9e8454',frame:'#668263'};
  const paper='#fbf6e7';
  const albumNames={basketball:'THE COURTSIDE ARCHIVE',football:'THE TEAM ALBUM',golf:'THE GOLF ALBUM',city:'THE DOCUMENTARY REELS',lab:'THE DESIGN ARCHIVE',eurus:'FROM THE CANDLE ATELIER',council:'THE MUSIC COLLECTION',arts:'BEHIND THE CURTAIN',culture:'THE CULTURE COLLECTION',civic:'THE COMMUNITY ARCHIVE',daycare:'THE LEARNING ALBUM',wellness:'THE HOUSE ALBUM',divide:'THE RESEARCH FILES'};
  function style(place){const s={...(themes[place.presentation||place.id]||fallback)};s.dark=['basketball','football','lab'].includes(place.id);s.card=s.dark?'#f4efdf':paper;s.footerText=place.id==='arts'?'#e1d0bb':s.muted;s.button=s.dark?'#365c57':'#e0e5ce';return s;}
  function line(y,color){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(82,y);ctx.lineTo(1718,y);ctx.stroke();}
  function fitted(value,x,y,w,size,color,weight=500){ctx.font=`${weight} ${size}px "DM Sans",Arial,sans-serif`;let sizeNow=size;while(ctx.measureText(String(value)).width>w&&sizeNow>16){sizeNow--;ctx.font=`${weight} ${sizeNow}px "DM Sans",Arial,sans-serif`;}text(value,x,y,sizeNow,color,'DM Sans',weight);}
  function rows(value,w,size){ctx.font=`500 ${size}px "DM Sans",Arial,sans-serif`;let count=1,row='';for(const word of String(value||'').split(' ')){const next=row?`${row} ${word}`:word;if(row&&ctx.measureText(next).width>w){count++;row=word;}else row=next;}return count;}
  function title(value,x,y,w,color){let size=28;while(rows(value,w,size)>2&&size>20)size--;wrap(value,x,y,w,size,size+7,color,'DM Sans',500);}
  function seconds(value){const n=Math.max(0,Math.round(Number(value)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
  function play(x,y,r=34){ctx.fillStyle='#234638dc';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle=paper;ctx.beginPath();ctx.moveTo(x-8,y-15);ctx.lineTo(x+15,y);ctx.lineTo(x-8,y+15);ctx.closePath();ctx.fill();}
  function close(s){round(1654,58,80,80,40,s.dark?'#355c58':'#e3dfcc');text('×',1676,65,52,s.ink);hit(1644,48,100,100,'close');}
  function background(place,s){
    ctx.clearRect(0,0,W,H);ctx.fillStyle=s.bg;ctx.fillRect(0,0,W,H);
    if(s.dark){ctx.strokeStyle=place.id==='lab'?'#355c70':'#315451';ctx.lineWidth=1;for(let x=54;x<1750;x+=68){ctx.beginPath();ctx.moveTo(x,42);ctx.lineTo(x,1120);ctx.stroke();}}
    if(place.id==='city'){ctx.fillStyle='#293e34';ctx.fillRect(0,0,W,38);for(let x=22;x<W;x+=57)round(x,10,31,17,3,'#dedec9');}
    if(place.id==='arts'){for(let x=0;x<W;x+=74){ctx.fillStyle=x%148?'#742f40':'#602537';ctx.fillRect(x,0,74,H);}round(47,45,1706,1096,4,paper);}
    if(place.id==='golf'||place.id==='culture'){round(46,42,1708,1097,6,paper);ctx.strokeStyle='#ddd5bf';ctx.lineWidth=2;ctx.strokeRect(59,55,1682,1071);}
    close(s);
  }
  function button(x,y,w,label,action,s,active=false){round(x,y,w,62,11,active?s.accent:s.button);fitted(label,x+23,y+20,w-46,24,active?(s.dark?s.bg:paper):s.ink,600);hit(x-5,y-6,w+10,74,action);}
  function gallery(place,{page=0,filter='all'}={},token){
    const s=style(place),all=place.media||[],photos=all.filter(m=>m.type==='image').length,films=all.filter(m=>m.type==='video').length;
    const entries=all.map((item,index)=>({item,index})).filter(({item})=>filter==='all'||(filter==='videos'?item.type==='video':item.type==='image'));
    const totalPages=Math.max(1,Math.ceil(entries.length/6)),current=Math.max(0,Math.min(totalPages-1,page)),slice=entries.slice(current*6,current*6+6);
    background(place,s);text(albumNames[place.id]||'THE MEDIA ARCHIVE',86,81,25,s.accent,'DM Sans',600);fitted(place.label,86,137,1480,60,s.ink,500);
    text(`${photos} ${photos===1?'image':'images'}  /  ${films} ${films===1?'film':'films'}`,88,218,26,s.muted);
    button(87,274,241,`ALL  ${all.length}`,'media-filter:all',s,filter==='all');button(350,274,288,`IMAGES  ${photos}`,'media-filter:images',s,filter==='images');button(661,274,264,`FILMS  ${films}`,'media-filter:videos',s,filter==='videos');
    const from=entries.length?current*6+1:0,to=Math.min(entries.length,(current+1)*6);text(`${String(from).padStart(2,'0')}—${String(to).padStart(2,'0')}  /  ${entries.length}`,1455,293,24,s.muted,'DM Sans',500);
    slice.forEach(({item,index},slot)=>{
      const x=84+(slot%3)*554,y=370+Math.floor(slot/3)*380,w=525,h=347,video=item.type==='video';
      round(x,y,w,h,8,s.card);round(x+14,y+14,w-28,215,4,'#e8e6d9');
      text(video?'FILM':'PHOTOGRAPH',x+33,y+108,24,'#8c9783','DM Sans',500);
      image(item.thumb||item.poster||item.src,{x:x+14,y:y+14,w:w-28,h:215},'',token,{action:`media-open:${index}`,contain:true,indicator:false,background:'#e8e6d9',onPaint:video?()=>play(x+w/2,y+121):undefined});if(video)play(x+w/2,y+121);
      if(video){round(x+397,y+242,110,34,17,'#304d3d');ctx.fillStyle=paper;ctx.beginPath();ctx.moveTo(x+411,y+252);ctx.lineTo(x+411,y+265);ctx.lineTo(x+420,y+258.5);ctx.closePath();ctx.fill();text(seconds(item.duration),x+429,y+249,19,paper,'DM Sans',500);}
      fitted((item.group||(video?'Film':'Photograph')).toUpperCase(),x+23,y+244,video?w-160:w-45,19,'#8a7959',600);
      title(item.title||item.caption||(video?'A moment in motion':'From the collection'),x+23,y+280,w-46,'#304f40');
      hit(x,y,w,h,`media-open:${index}`);
    });
    if(!entries.length){text(filter==='videos'?'No films in this collection yet.':'No photographs in this collection yet.',104,501,45,s.ink,'Instrument Serif');text('Choose another tab to explore the collection.',106,574,29,s.muted);}
    line(1148,s.dark?'#55716a':'#d2d8c2');button(84,1180,374,'←  BACK TO THE STORY','media-back',s);text(`${current+1} / ${totalPages}  SHEETS`,809,1200,25,s.footerText,'DM Sans',500);
    if(current>0)button(1287,1180,180,'←  PREV','media-page:prev',s);
    if(current+1<totalPages)button(1490,1180,228,'NEXT  →','media-page:next',s,true);
    texture.needsUpdate=true;return{theme:s,page:current,pages:totalPages,count:entries.length};
  }
  function photo(place,index,token){
    const s=style(place),media=place.media||[],item=media[index],photos=media.filter(m=>m.type==='image'),ordinal=photos.indexOf(item)+1;background(place,s);
    if(!item){text('This photograph is unavailable.',87,190,52,s.ink,'Instrument Serif');button(84,1180,355,'←  BACK TO THE ARCHIVE','archive',s);texture.needsUpdate=true;return s;}
    text(`${albumNames[place.id]||'THE MEDIA ARCHIVE'}  /  ${String(ordinal).padStart(2,'0')}`,86,80,24,s.accent,'DM Sans',600);
    fitted(item.title||item.group||'A closer look',86,136,1460,47,s.ink,500);
    round(86,226,1628,808,8,s.dark?'#153438':'#e6e4d7');image(item.src,{x:86,y:226,w:1628,h:808},'',token,{contain:true,interactive:false,indicator:false});
    wrap(item.caption||item.title||'',88,1057,1610,26,33,s.muted);
    line(1148,s.dark?'#55716a':'#d2d8c2');button(84,1180,393,'←  BACK TO THE ARCHIVE','archive',s);text(`${ordinal} / ${photos.length}`,815,1200,25,s.footerText,'DM Sans',500);
    if(photos.length>1){button(1287,1180,180,'←  PREV','media-item:prev',s);button(1490,1180,228,'NEXT  →','media-item:next',s,true);}
    texture.needsUpdate=true;return s;
  }
  return{gallery,photo};
}
