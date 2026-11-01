// Each destination reads as an object from that activity, inside the 3D world.
export function createThemedExhibits({ctx,W,H,round,text,wrap,hit,image,diagram,texture}){
  const paper='#fbf6e7',chalk='#f4f1dc';
  const themes={
    basketball:{bg:'#183c40',ink:chalk,muted:'#b5c8bf',accent:'#efb16f',frame:'#a26940',object:'THE COURTSIDE PLAYBOOK'},
    football:{bg:'#234c3e',ink:chalk,muted:'#bdcdbc',accent:'#d3df9a',frame:'#6d8064',object:'THE TEAM PLAYBOOK'},
    golf:{bg:'#f2eedc',ink:'#2b5140',muted:'#788471',accent:'#9a7c45',frame:'#526c4b',object:'THE COURSE BOOK'},
    city:{bg:'#eee9dc',ink:'#283d37',muted:'#758074',accent:'#9b754e',frame:'#303f36',object:'DOCUMENTARY / PRODUCTION NOTES'},
    divide:{bg:'#e7eddf',ink:'#314d43',muted:'#6d8678',accent:'#8a9c63',frame:'#627c69',object:'THE URBAN RESEARCH ATLAS'},
    lab:{bg:'#183f54',ink:'#edf3e9',muted:'#accbd1',accent:'#b4ddcb',frame:'#446779',object:'DESIGN STUDIO / WORKING NOTES'},
    eurus:{bg:'#f3e8d4',ink:'#506044',muted:'#8c9376',accent:'#b28351',frame:'#b39972',object:'ATELIER / PRODUCT STORIES'},
    culture:{bg:'#f2e6cf',ink:'#3f5240',muted:'#8e8871',accent:'#a35443',frame:'#916747',object:'THE CULTURE SCROLL'},
    council:{bg:'#f7f0dc',ink:'#404f45',muted:'#8a8b78',accent:'#9c7d9d',frame:'#706457',object:'REHEARSAL / PERSONAL NOTES'},
    arts:{bg:'#682c3c',ink:'#413c36',muted:'#8b806c',accent:'#ab8350',frame:'#562637',object:'THE PLAYBILL'},
    civic:{bg:'#e0dcc4',ink:'#344e40',muted:'#7f8c78',accent:'#836b8a',frame:'#9b845d',object:'THE COMMUNITY NOTICEBOARD'},
    wellness:{bg:'#eee4d9',ink:'#3e5948',muted:'#8c917d',accent:'#c38778',frame:'#ac9074',object:'THE HOUSE SCRAPBOOK'},
    daycare:{bg:'#f0eed6',ink:'#3f5d4c',muted:'#80917a',accent:'#a67f51',frame:'#9ea980',object:'THE LEARNING JOURNAL'}
  };
  function line(points,color,width=3,dash=[]){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(dash);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();}
  function circle(x,y,r,stroke,fill,width=3){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function tape(x,y,w=105,color='#d4b881'){ctx.save();ctx.translate(x,y);ctx.rotate(-.075);ctx.globalAlpha=.9;ctx.fillStyle=color;ctx.fillRect(-w/2,-13,w,26);ctx.restore();}
  function arrow(a,b,color=chalk,dashed=false){line([a,b],color,4,dashed?[13,11]:[]);const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);line([[b[0]-18*Math.cos(angle-.45),b[1]-18*Math.sin(angle-.45)],b,[b[0]-18*Math.cos(angle+.45),b[1]-18*Math.sin(angle+.45)]],color,4);}
  function close(s){round(1654,58,80,80,40,s.bg==='#183f54'?'#355e6b':s.ink===chalk?'#315650':'#e3ddc9');text('×',1676,65,52,s.ink===chalk||s.bg==='#183f54'?chalk:s.ink);hit(1644,48,100,100,'close');}
  function pageButtons(page,total,s,place){
    const dark=s.ink===chalk||s.bg==='#183f54';const button=dark?'#355c58':'#e4e5d2',ink=dark?chalk:s.ink;
    line([[82,1148],[1718,1148]],dark?'#55716a':'#d2d8c2',2);
    round(84,1180,292,66,11,button);text('←  CITY MAP',111,1200,26,ink,'DM Sans',500);hit(74,1170,312,86,'close');
    round(405,1180,339,66,11,button);text('EXPLORE THE MODEL  ↗',428,1201,24,ink,'DM Sans',500);hit(395,1170,359,86,'inspect');
    text(`${String(page+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`,835,1200,25,s.muted,'DM Sans',500);
    if(place?.media?.length){
      const photos=place.media.filter(m=>m.type==='image').length,films=place.media.filter(m=>m.type==='video').length;
      round(993,1175,343,76,11,dark?'#385b55':'#dfdfc9');text('OPEN ARCHIVE  ↗',1012,1186,24,ink,'DM Sans',600);text(`${photos} photos  /  ${films} films`,1013,1219,18,s.muted,'DM Sans',500);hit(983,1165,363,96,'archive');
    }
    if(page>0){round(1374,1180,112,66,11,button);text('←',1411,1192,38,ink);hit(1364,1170,132,86,'prev');}
    round(1506,1180,214,66,11,dark?s.accent:s.ink);text(page+1===total?'NEXT PLACE ↗':'NEXT PAGE →',1525,1201,24,dark?s.bg:paper,'DM Sans',600);hit(1496,1170,234,86,page+1===total?'next-place':'next');
  }
  function photoCard(src,caption,rect,token,s,{second=false,taped=false,film=false,contain=false}={}){
    if(!src)return;
    const{x,y,w,h}=rect;ctx.font='400 22px "DM Sans",Arial,sans-serif';let rows=1,row='';for(const word of String(caption||'').split(' ')){const next=row?`${row} ${word}`:word;if(row&&ctx.measureText(next).width>w){rows++;row=word;}else row=next;}
    round(x-15,y-15,w+30,h+47+rows*29,5,s.ink===chalk?'#f0eedc':paper);round(x,y,w,h,10,'#e7e6d8');image(src,rect,'',token,{action:second?'photo:2':'photo',contain,captionColor:s.muted});
    wrap(caption,x,y+h+17,w,22,29,'#747b68');if(taped){tape(x+30,y-16);tape(x+w-24,y-16);}
    if(film){for(let i=0;i<Math.floor(w/40);i++){round(x+i*40,y-13,22,9,2,'#31443b');round(x+i*40,y+h+57,22,9,2,'#31443b');}}
  }
  function court(x,y,w,h,s,football=false){
    const c='#9fbbb0';round(x,y,w,h,5,football?'#2c5848':'#20474a');
    ctx.save();ctx.strokeStyle=c;ctx.lineWidth=3;ctx.strokeRect(x+34,y+26,w-68,h-52);
    if(football){
      line([[x+w/2,y+26],[x+w/2,y+h-26]],c);circle(x+w/2,y+h/2,57,c);ctx.strokeRect(x+34,y+h*.27,105,h*.46);ctx.strokeRect(x+w-139,y+h*.27,105,h*.46);ctx.strokeRect(x+34,y+h*.38,43,h*.24);ctx.strokeRect(x+w-77,y+h*.38,43,h*.24);
    }else{
      const mid=x+w/2,top=y+26;ctx.strokeRect(mid-82,top,164,h*.43);ctx.beginPath();ctx.arc(mid,top+h*.43,82,0,Math.PI);ctx.stroke();ctx.beginPath();ctx.arc(mid,top+40,w*.34,0,Math.PI);ctx.stroke();line([[mid-w*.34,top+40],[mid-w*.34,top]],c);line([[mid+w*.34,top+40],[mid+w*.34,top]],c);circle(mid,top+37,14,s.accent,null,4);line([[mid-31,top+17],[mid+31,top+17]],s.accent,4);ctx.beginPath();ctx.arc(mid,y+h-26,52,Math.PI,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
    const tokens=football?[[.29,.33,'1'],[.48,.62,'2'],[.71,.36,'3']]:[[.26,.70,'1'],[.65,.68,'2'],[.48,.39,'3']];
    for(const [tx,ty,n]of tokens){circle(x+w*tx,y+h*ty,23,null,s.accent);text(n,x+w*tx-8,y+h*ty-14,27,s.bg,'DM Sans',600);}
    const crosses=football?[[.6,.35],[.74,.66]]:[[.35,.53],[.7,.43]];for(const [tx,ty]of crosses){const px=x+w*tx,py=y+h*ty;line([[px-11,py-11],[px+11,py+11]],chalk,4);line([[px+11,py-11],[px-11,py+11]],chalk,4);}
    arrow([x+w*.3,y+h*.69],[x+w*.52,y+h*.66],chalk,true);arrow([x+w*.64,y+h*.61],[x+w*.52,y+h*.24],s.accent);
    text('MOVE',x+45,y+h-14,19,s.muted,'DM Sans',500);text('PASS',x+151,y+h-14,19,s.muted,'DM Sans',500);line([[x+102,y+h-3],[x+137,y+h-3]],s.accent,3);line([[x+206,y+h-3],[x+246,y+h-3]],chalk,3,[7,5]);
  }
  function course(x,y,w,h,s){
    round(x,y,w,h,18,'#e1e7cf');ctx.save();ctx.translate(x,y);
    ctx.fillStyle='#c2d0a7';ctx.beginPath();ctx.ellipse(w*.48,h*.5,w*.36,h*.35,-.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#aac392';ctx.beginPath();ctx.ellipse(w*.62,h*.39,w*.15,h*.26,-.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ece0b8';ctx.beginPath();ctx.ellipse(w*.73,h*.66,w*.10,h*.13,-.3,0,Math.PI*2);ctx.fill();line([[w*.29,h*.70],[w*.44,h*.56],[w*.61,h*.40]],'#728b63',3,[7,8]);circle(w*.29,h*.70,7,null,paper);line([[w*.61,h*.40],[w*.61,h*.15]],s.ink,4);ctx.fillStyle='#bd9762';ctx.beginPath();ctx.moveTo(w*.61,h*.15);ctx.lineTo(w*.76,h*.22);ctx.lineTo(w*.61,h*.27);ctx.fill();ctx.restore();text('PRACTICE  /  FOCUS  /  PASS IT ON',x+27,y+h-38,21,s.ink,'DM Sans',500);
  }
  function sports(place,p,page,token,s){
    if(place.id==='golf'){
      round(44,38,1712,1081,8,paper);line([[895,53],[895,1110]],'#d9d5be',3);line([[909,53],[909,1110]],'#e8e2d1',4);
      text('NIKI / THE COURSE BOOK',95,91,27,s.accent,'DM Sans',600);text('GOLF',94,146,76,s.ink,'Instrument Serif');
      wrap(place.role,98,241,720,27,37,s.muted);text(place.years,98,320,23,s.muted);
      const dual=!!p.image2;
      if(dual){
        photoCard(p.image,p.caption,{x:104,y:382,w:340,h:510},token,s,{taped:true,contain:true});
        photoCard(p.image2,p.caption2,{x:485,y:382,w:329,h:220},token,s,{second:true,taped:true,contain:true});
        line([[486,751],[814,751]],'#d6dcc9',2);text('FIELD NOTES',486,784,22,s.accent,'DM Sans',600);wrap(place.summary,486,832,327,34,43,s.ink,'Instrument Serif');
      }else photoCard(p.image,p.caption,{x:104,y:382,w:710,h:580},token,s,{taped:true,contain:true});
      text('PLAYER CARD',963,99,26,s.accent,'DM Sans',600);text('LAWRENCEVILLE / FIRST TEE',963,147,23,s.muted,'DM Sans',500);
      const stats=(place.stats||[]).slice(0,4);stats.forEach((st,i)=>{const yy=212+i*85;line([[963,yy-9],[1699,yy-9]],'#d6dcc9',2);text(st.value,965,yy+7,45,s.ink,'Instrument Serif');wrap(st.label,1167,yy+12,515,25,32,s.muted);});line([[963,544],[1699,544]],'#d6dcc9',2);
      const end=wrap(p.title,963,587,720,48,56,s.ink,'Instrument Serif');const bodyEnd=wrap(p.body,966,end+25,718,29,39,s.ink);const courseY=Math.max(899,bodyEnd+25);course(961,courseY,739,1085-courseY,s);
    }else{
      text(`${place.number}  /  ${place.id==='basketball'?'COURTSIDE':'MATCHDAY'}`,100,82,26,s.accent,'DM Sans',600);
      const bottom=wrap(p.title,95,143,1480,70,76,s.ink,'Instrument Serif');wrap(place.role,100,Math.max(bottom+15,240),1460,27,36,s.muted);
      court(100,338,803,388,s,place.id==='football');
      text(p.eyebrow,104,784,24,s.accent,'DM Sans',600);wrap(p.body,104,835,785,34,47,s.ink);
      text(place.years.toUpperCase(),104,1086,22,s.muted,'DM Sans',500);
      const dual=!!p.image2;photoCard(p.image,p.caption,{x:992,y:352,w:698,h:dual?310:650},token,s,{taped:true,contain:place.id==='football'});if(dual)photoCard(p.image2,p.caption2,{x:992,y:795,w:698,h:260},token,s,{second:true,taped:true,contain:true});
    }
    close(s);pageButtons(page,place.pages.length,s,place);
  }
  function skin(id,s){
    if(id==='lab'||id==='divide'){
      ctx.save();ctx.strokeStyle=id==='lab'?'#44697a':'#ced9c5';ctx.lineWidth=1;ctx.globalAlpha=.55;for(let x=50;x<W;x+=42)line([[x,30],[x,1126]],ctx.strokeStyle,1);for(let y=30;y<1126;y+=42)line([[50,y],[1750,y]],ctx.strokeStyle,1);ctx.restore();
      if(id==='divide'){for(const x of [598,1200])line([[x,20],[x,1132]],'#c4cfbb',2);line([[48,315],[1752,315]],'#c4cfbb',2);}
    }else if(id==='arts'){
      for(let x=0;x<1800;x+=70){ctx.fillStyle=x%140?'#742f40':'#602537';ctx.fillRect(x,0,70,1140);}round(66,45,1668,1080,4,paper);for(let x=90;x<1730;x+=55)circle(x,68,4,null,'#ba995f');
    }else if(id==='council'){
      for(let yy=325;yy<1110;yy+=130)for(let i=0;i<5;i++)line([[74,yy+i*13],[1722,yy+i*13]],'#dedcc9',1);
      line([[1030,370],[1030,1110]],'#d3c5ba',2);text('♪',1590,213,96,'#b6a1b3','Georgia');
    }else if(id==='culture'){
      for(let x=84;x<1720;x+=49)line([[x,52],[x,1130]],'#e6d8bb',1);round(43,38,28,1100,4,'#c1a774');round(1729,38,28,1100,4,'#c1a774');round(1519,222,99,99,3,null,s.accent);text('N',1546,230,70,s.accent,'Instrument Serif');
    }else if(id==='city'){
      ctx.fillStyle='#293e34';ctx.fillRect(0,0,W,48);for(let x=24;x<W;x+=57)round(x,13,31,20,3,'#dedec9');text('REC',1430,230,25,s.accent,'DM Sans',600);circle(1403,245,8,null,'#b3674b');
    }else if(id==='eurus'){
      circle(1539,226,121,'#dbcaa9',null,2);circle(1539,226,99,'#e2d5b9',null,1);line([[79,1130],[1720,1130]],'#bba176',2);text('HANDMADE / GIVE BACK',1185,292,23,s.muted,'DM Sans',500);
    }else if(id==='daycare'){
      for(let y=364;y<1130;y+=51)line([[76,y],[1728,y]],'#d9dfc9',1);line([[1060,340],[1060,1119]],'#d5aa9a',2);for(const [i,c]of ['#bbd1c0','#dcbfa1','#bdcbd1'].entries())round(1374+i*95,232,74,70,7,c);text('A',1396,243,44,'#526958');text('B',1490,243,44,'#766148');text('C',1584,243,44,'#526b71');
    }else if(id==='civic'||id==='wellness'){
      round(60,364,960,758,4,paper);tape(138,363,126,id==='civic'?'#baa8bc':'#d3aaa0');tape(944,363,126,id==='civic'?'#baa8bc':'#d3aaa0');
      if(id==='wellness'){text('♥',1511,228,86,'#c78c7c');line([[1380,323],[1634,323]],'#c78c7c',3);}
    }
  }
  function general(place,p,page,token,s){
    skin(place.id,s);const dark=place.id==='lab';
    text(s.object,88,89,25,s.accent,'DM Sans',600);
    wrap(p.title,83,162,1510,69,76,s.ink,'Instrument Serif');
    wrap(place.role,88,288,1220,26,35,s.muted);text(place.years,88,336,22,s.muted);
    text(p.eyebrow,97,425,24,s.accent,'DM Sans',600);
    const bodyEnd=wrap(p.body,96,477,902,37,51,s.ink);
    if(page===0&&place.stats?.length){const sy=Math.max(989,bodyEnd+25);for(const[ i,stat]of place.stats.slice(0,2).entries()){text(stat.value,96+i*462,sy,46,s.accent,'Instrument Serif');wrap(stat.label,96+i*462,sy+53,432,22,29,s.muted);}}
    if(p.image)photoCard(p.image,p.caption,{x:1100,y:427,w:586,h:577},token,s,{taped:['civic','wellness','daycare','council'].includes(place.id),film:place.id==='city'});else diagram(place,1088,416,610,590,{captionColor:s.muted});
    if(dark){text('ITERATE / TEST / REFINE',1100,1098,23,s.muted,'DM Sans',500);}
    close(s);pageButtons(page,place.pages.length,s,place);
  }
  function story(place,page,token){
    const s=themes[place.presentation||place.id];if(!s)return null;
    ctx.clearRect(0,0,W,H);ctx.fillStyle=s.bg;ctx.fillRect(0,0,W,H);const p=place.pages[page];
    if(['basketball','football','golf'].includes(place.id))sports(place,p,page,token,s);else general(place,p,page,token,s);
    texture.needsUpdate=true;return s;
  }
  return{story,themes};
}
