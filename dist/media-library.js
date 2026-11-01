import {imageMedia} from './media-images.js';
import {videoMedia} from './media-videos.js';

// Mix films into each subject's photo archive instead of hiding them at the end.
export function attachMedia(places){
  for(const place of places){
    const images=imageMedia[place.id]||[],videos=videoMedia[place.id]||[];
    const groups=[...new Set([...videos,...images].map(item=>item.group||'Field notes'))];
    place.media=groups.flatMap(group=>{
      const photos=images.filter(item=>(item.group||'Field notes')===group);
      const films=videos.filter(item=>(item.group||'Field notes')===group);
      const mixed=[];
      while(photos.length||films.length){if(films.length)mixed.push(films.shift());mixed.push(...photos.splice(0,3));}
      return mixed;
    });
  }
}

export function archiveItems(place,filter='all'){
  return (place?.media||[]).map((item,index)=>({item,index})).filter(({item})=>filter==='all'||item.type===(filter==='videos'?'video':'image'));
}
