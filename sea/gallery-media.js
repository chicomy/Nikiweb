import {imageMedia} from '../dist/media-images.js';
import {videoMedia} from '../dist/media-videos.js';

const shared = path => path?.replace(/^\.\//, '../dist/');
const archive = key => [...(imageMedia[key] || []), ...(videoMedia[key] || [])];
const fromArchive = item => ({...item, src: shared(item.src), thumb: shared(item.thumb || item.poster),
  print: shared(item.poster || item.thumb), film: item.type === 'video'});

// Some city archives split across multiple sea islands. Keep their original groups and captions.
function collection(place) {
  if (place.id === 'glasses') return [...archive('lab'), ...archive('daycare').filter(item => item.group === 'Volunteer teaching')];
  if (place.id === 'violin') return archive('council').filter(item => item.group === 'Violin');
  if (place.id === 'vocal') return archive('council').filter(item => item.group !== 'Violin');
  if (place.id === 'student-gov') return archive('civic').filter(item => item.group !== 'Civic learning');
  if (place.id === 'civic') return archive('civic').filter(item => item.group === 'Civic learning');
  if (place.id === 'about') return archive('wellness');
  return archive(place.media || place.id);
}

export function galleryItems(place) {
  const media = archive(place.media || place.id);
  const featured = (place.photos || []).map(entry => typeof entry === 'string'
    ? media.find(item => item.id === entry) : entry).filter(item => item?.src && !item.empty)
    .map(item => item.type ? fromArchive(item) : {...item, thumb: item.print || item.src});
  const story = (place.tour?.story?.moments || []).flatMap(moment => moment.photos || []).filter(photo => photo.src);
  const seen = new Set();
  return [...featured, ...story, ...collection(place).map(fromArchive)].filter(item => {
    const key = new URL(item.src, 'https://site.invalid/sea/').pathname;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(item => {
    const key = item.src.split('/').pop().replace(/\W/g, '_');
    return {...item, caption: place.captions?.[key] ?? item.caption, group: item.group || 'Highlights'};
  });
}
