// Which real projects live on which island. Text comes from the existing site's content file.
import {places} from '../dist/city-content.js';

const place = id => places.find(p => p.id === id);

// A project can take a whole place, or only some of its pages when one place splits across islets.
const project = (id, overrides = {}) => {
  const p = place(id);
  const pages = overrides.pageIndexes ? overrides.pageIndexes.map(i => p.pages[i]) : p.pages;
  return {
    key: overrides.key || id,
    title: overrides.title || p.title,
    role: overrides.role || p.role,
    years: overrides.years || p.years,
    stats: overrides.stats || p.stats,
    pages: [...pages, ...(overrides.extraPages || [])].map((page, index) => ({
      ...page,
      body: overrides.reword?.(page.body) || page.body,
      photo: overrides.pagePhotos?.[index],
    })),
  };
};

// Two tidy columns of photos leave the middle of the screen to the island.
const COLUMN_SPOTS = {wide: [[.09, .21], [.09, .5], [.09, .79], [.91, .21], [.91, .5], [.91, .79]], tall: [[.17, .23], [.5, .225], [.83, .23], [.17, .58], [.5, .585], [.83, .58]]};

// An island with `islets` zooms in when clicked, and each islet then has its own page. Same order as symbols.js.
export const ISLANDS = [
  {
    id: 'glasses', course: 'showcase', media: 'lab', face: 'surprised', name: 'Glasses', title: 'Feel To Read', tagline: 'AI navigation for visually impaired users',
    color: '#c9bdf4', symbol: 'glasses', layout: {wide: [-.6, .34], tall: [-.5, .3]},
    // First-person draft from Niki's resume, to be put into her own words.
    why: 'AI navigation glasses for blind and visually impaired people.',
    // Words below come from the Feel to Read website and the GLV-024P spec sheet.
    photos: [
      {src: './assets/glasses/product-render.jpg', print: './assets/glasses/product-render.jpg', caption: 'The glasses: model GLV-024P.', whole: true},
      'lab-film-01',
      {src: './assets/glasses/cad-front.jpg', print: './assets/glasses/cad-front.jpg', caption: 'Front: the camera, recording light and two buttons.', whole: true},
      {src: './assets/glasses/cad-back.jpg', print: './assets/glasses/cad-back.jpg', caption: 'Back: the arms that hold the speakers.', whole: true},
    ],
    photoSpots: {wide: [], tall: []},
    captions: {lab_film_01_mp4: 'Researching parts in Huaqiangbei’s electronics shops, Shenzhen.'},
    tour: {
      // Niki's own words, split into moments, with short headings added. Names are changed for privacy.
      story: {
        finish: 'Meet the glasses ↓',
        moments: [
          {heading: 'Guizhou', photos: [{caption: 'Guizhou, summer 2024.'}], text: 'In the summer of 2024, an experience in Guizhou changed my outlook on service and empathy. As an assistant tutor in this mountainous region of China, I spent three weeks supporting students with their homework and helping teachers plan lessons.'},
          {heading: 'Wei', photos: [{caption: 'Wei, whose name I’ve changed.'}], text: 'Most importantly, I met a friend who changed my perspective on life. Wei, whose name I’ve changed here to protect his privacy, was a teenager my age, but cataracts had left him blind since birth. His parents left him with his eighty-six-year-old grandfather in a wooden hut. I visited frequently while I was there. During our conversations, he expressed his strong desire to be educated and, one day, earn money for his grandfather. However, his present conditions made this feel impossible to him.'},
          {heading: 'What I got wrong', text: 'I considered offering him some Braille books to support his education, but he had not received formal Braille instruction. I felt guilty for my ignorance.'},
          {heading: 'The glasses', text: 'Months after the Guizhou experience, I started a project to design AI-supported glasses for visually impaired children, which they could wear to identify objects and read. As the project grew and I listened to more of the people who would use it, the glasses also became a way to navigate: to find your way and ask what’s in front of you.'},
          {heading: 'The surgery', photos: [{caption: 'After his eye surgery.'}, {caption: 'Wei with his glasses.'}], text: 'After I returned home, I worked as a tutor and was able to pay for his cataract surgery. Although his eyes have not fully recovered, he can sense light and see with glasses.'},
          {heading: 'What I learned', text: 'Through my ignorance, I learned the importance of adopting others’ perspectives when offering help and providing considerate, personalized support.'},
        ],
      },
      // Cards at the end of the Polaroid stack, waiting for real pictures.
      placeholders: [
        {caption: 'One of my six working prototypes.'},
        {caption: 'Testing a prototype.'},
        {caption: 'Interviews at the Beijing School for the Blind.'},
        {caption: 'The pilot with school staff and students.'},
      ],
      title: 'Explore the frame',
      lede: 'Choose a part to turn the model toward it.',
      note: 'The 3D model is a simplified illustration, and part positions are approximate.',
      parts: [
        {id: 'frame', name: 'Whole frame', tag: 'GLV-024P', heading: 'Looks like glasses, works like a guide', text: 'Navigation glasses in a classic square frame, in glossy black with grey temples. Everything that helps you sits inside: camera at the front, buttons on top of each temple, speakers by your ears.'},
        {id: 'camera', name: 'Camera', tag: '8 MP', heading: 'Sees what’s in front of you', text: 'The camera faces where your head faces. Ask the AI to describe a room, a sign or what’s on a table, and it answers out loud.'},
        {id: 'left-button', name: 'Left button', tag: 'voice', heading: 'Voice, calls and music', text: 'On top of the left temple, so you can find it by touch. Press once to answer a call or play and pause music. Press twice or three times to change songs.'},
        {id: 'right-button', name: 'Right button', tag: 'camera', heading: 'Photos and video', text: 'On top of the right temple. Press once to take a photo. Hold for three seconds to start recording, then press once to stop.'},
        {id: 'recording', name: 'Recording light', tag: 'white', heading: 'Shows when it’s recording', text: 'The white light by the right lens flashes once for a photo and stays on while recording video.'},
        {id: 'status', name: 'Status light', tag: '3 colors', heading: 'Shows what it’s doing', text: 'A three-color light that faces the wearer and shows the state of the system.'},
        {id: 'microphones', name: 'Microphones', tag: '4 mics', heading: 'Hears you over the noise', text: 'Four microphones pick up your voice, cut background noise on calls and listen for “Hey Luky.”'},
        {id: 'speakers', name: 'Speakers', tag: 'open-ear', heading: 'Keeps your ears open', text: 'Speakers sit in the temples just above your ears, not inside them. You still hear traffic, voices and the sound of the space around you.'},
        {id: 'charging', name: 'Charging pins', tag: '2-pin', heading: 'Charges in its case', text: 'Two pins at the end of the temple charge the glasses in their case, in about an hour.'},
      ],
      how: {title: 'How it works', lede: 'Feel to Read switches between two kinds of guidance, so you aren’t stuck when the map runs out or the signal drops.'},
      tabs: [
        {id: 'map', name: 'Map routing', text: 'Choose a destination and hear turn-by-turn directions in your ear as you walk. Routing is built on map (GIS) data.', points: [
          {name: 'Online:', text: 'live routes when you have a connection.'},
          {name: 'Offline:', text: 'routes keep working when you lose signal.'},
        ]},
        {id: 'vision', name: 'Vision guidance', text: 'No map needed. The camera looks at the space in front of you and the AI guides you by voice from what it sees.', points: [
          {name: 'Made for:', text: 'indoors, campuses and places maps don’t cover.'},
          {name: 'Ask anytime:', text: '“Hey Luky, what’s in front of me?”'},
        ]},
        // First-person draft from Niki's resume, to be put into her own words.
        {id: 'mine', name: 'My part', points: [
          {name: 'What I built:', text: 'I developed six working prototypes that combine spoken GIS navigation routes with AI camera-based guidance.'},
          {name: 'Who I listened to:', text: 'I conducted interviews at the Beijing School for the Blind and consulted low-vision experts at Mississippi State University to refine the design.'},
          {name: 'The pilot:', text: 'School staff and students with visual impairments tested the glasses, so the controls, voice prompts and frame were shaped by real use.'},
          {name: 'Why it matters:', text: 'Existing devices can cost upwards of $4,000. I’m targeting a unit cost of about $70–80, so more people can afford one.'},
        ]},
      ],
    },
    rankings: [
      {value: '6', label: 'Working prototypes'},
      {value: '2', label: 'Navigation modes'},
      {value: '$70–80', label: 'Target unit cost'},
      {value: '', label: 'Founder and Product Designer'},
    ],
    projects: [project('lab', {pageIndexes: [0, 1]})],
  },
  {
    id: 'urban', face: 'wink', name: 'Urban Design', tagline: 'Highway 101 and the oil city of Daqing',
    color: '#c7d4dc', symbol: 'urban', layout: {wide: [.02, .62], tall: [.5, .3]},
    islets: [
      {
        id: 'divide', course: 'divide', face: 'wink', name: 'Divided by 101', tagline: 'Palo Alto, East Palo Alto and Highway 101',
        why: 'How did two neighboring cities become worlds apart?',
        // Niki's own maps, charts and portfolio cover, from her research files.
        photos: [
          {src: './assets/photos/divide-satellite.jpg', print: './assets/photos/divide-satellite-print.jpg', short: 'The divide.', caption: 'Highway 101, San Francisquito Creek and the county line.'},
          {src: './assets/photos/divide-housing.jpg', print: './assets/photos/divide-housing-print.jpg', short: 'Housing today.', caption: 'Housing outcomes in both cities, 2019–2023.'},
          {src: './assets/photos/divide-cover.jpg', print: './assets/photos/divide-cover-print.jpg', short: 'Portfolio.', caption: 'My research portfolio.'},
          {src: './assets/photos/divide-four-ways.jpg', print: './assets/photos/divide-four-ways-print.jpg', short: 'Four ways.', caption: 'Four ways the divide was built, 1886–1983.'},
          {src: './assets/photos/divide-sales-tax.jpg', print: './assets/photos/divide-sales-tax-print.jpg', short: 'Sales tax, 1977.', caption: 'Sales tax revenue per resident, 1977.'},
          {src: './assets/photos/divide-stanford-land.jpg', print: './assets/photos/divide-stanford-land-print.jpg', short: 'Stanford land.', caption: 'Stanford land by use.'},
          {src: './assets/photos/divide-costs.jpg', print: './assets/photos/divide-costs-print.jpg', short: 'Home values.', caption: 'Home values and rents, block group by block group.'},
        ],
        phonePhotos: [0, 2, 1],
        photoSpots: {wide: [[.175, .66], [.105, .245], [.735, .775], [.905, .775], [.895, .24], [.735, .49], [.905, .49]], tall: [[.17, .25], [.5, .25], [.83, .25]], notesTall: [[.17, .655], [.5, .655], [.83, .655]]},
        stories: [
          {id: 'question', name: 'The question', text: 'I study how urban planning, racial segregation, housing policy and Stanford’s expansion shaped the gap between Palo Alto and East Palo Alto.'},
          {id: 'method', name: 'How I did it', text: 'I built maps with ArcGIS and Python, then connected them to county records, Stanford archives and community histories, including redlining and the Nairobi Movement.'},
          {id: 'found', name: 'What I found', text: 'Racial covenants, blockbusting, a freeway that erased East Palo Alto’s business district, and a far smaller tax base all helped build the divide.'},
        ],
        rankings: [
          {value: '~8×', label: 'Sales tax gap, 1977'},
          {value: '19 of 20', label: 'Agencies discriminating, 1958'},
          {value: '61% vs 43%', label: 'Renters paying 30%+ of income'},
        ],
      },
      {
        id: 'city', course: 'daqing', media: 'city', face: 'surprised', name: 'Rise and Decline', tagline: 'A documentary on the oil city of Daqing',
        why: 'Listening to an oil city, then making its story visible.',
        photos: [
          // Waiting for the finished documentary and pictures from the screening. The film gets the largest spot.
          {empty: true, slot: 'Film to add', caption: 'The final film.'},
          'city-photo-023', 'city-photo-113', 'city-photo-022', 'city-film-01',
          'city-film-02',
          {empty: true, caption: 'The screening.'},
        ],
        phonePhotos: [0, 5, 6],
        captions: {city_film_02_mp4: 'Behind the camera.', city_photo_023_jpg: 'Listening to a local story.', city_photo_113_jpg: 'A pumpjack in Daqing.', city_photo_022_jpg: 'At the oilfield.', city_film_01_mp4: 'Filming on location.'},
        photoSpots: {wide: [[.175, .66], [.105, .245], [.735, .775], [.905, .775], [.895, .24], [.735, .495], [.905, .495]], tall: [[.21, .265], [.58, .25], [.855, .25]], notesTall: [[.17, .655], [.5, .655], [.83, .655]]},
        stories: [
          {id: 'city', name: 'The city', text: 'Oil was discovered in Daqing in 1959, and the city grew up around it. I wanted to understand what happens to a place built on one resource.'},
          {id: 'fieldwork', name: 'The fieldwork', text: 'I led a six-person team through two weeks of oral-history interviews, site visits and local history research, and built ArcGIS maps of the city.'},
          {id: 'film', name: 'The documentary', text: 'We produced a documentary proposing planning reforms, screened at a local cinema for 1,000+ attendees including local officials.'},
        ],
        rankings: [
          {value: '6', label: 'Team members'},
          {value: '2 weeks', label: 'Of fieldwork'},
          {value: '1,000+', label: 'Cinema audience'},
        ],
      },
    ],
    projects: [],
  },
  {
    id: 'candle', course: 'display', media: 'eurus', face: 'laugh', name: 'Candle', title: 'Euros Forest', tagline: 'Handmade candles that give back',
    // Words from Niki's design portfolio and resume, shortened to fit the cards.
    why: 'Experience Nature. Grow It Again.',
    photos: [
      {src: './assets/photos/candle-hero.jpg', print: './assets/photos/candle-hero.jpg', caption: 'The Christmas candle set.'},
      {src: './assets/photos/candle-sketches.jpg', print: './assets/photos/candle-sketches.jpg', caption: 'My sketches and design development.'},
      'eurus-photo-050',
      {src: './assets/photos/candle-boxes.jpg', print: './assets/photos/candle-boxes.jpg', caption: 'The three packages, which connect into one Christmas woodland.'},
      {src: './assets/photos/candle-seed-paper.jpg', print: './assets/photos/candle-seed-paper.jpg', caption: 'Seed paper: tear, add soil, plant and water, and grow.'},
      'eurus-photo-056',
    ],
    phonePhotos: [0, 3, 2],
    captions: {
      eurus_photo_050_jpg: 'At our charity sale.',
      eurus_photo_056_jpg: 'Sharing the boxed candles at the stall.',
    },
    photoSpots: {
      wide: [[.09, .21], [.09, .5], [.09, .79], [.91, .21], [.91, .5], [.91, .79]],
      tall: [[.17, .215], [.5, .215], [.83, .215]],
      notesTall: [[.17, .73], [.5, .73], [.83, .73]],
    },
    stories: [
      {id: 'why', name: 'Why I made it', text: 'During the pandemic, I spent long periods inside a hospital, missing trees and fresh air. This collection brings the feeling of a forest to places where nature feels distant.'},
      {id: 'nature', name: 'Back to nature', text: 'Each box holds seed paper with flower or herb seeds. When the candle is finished, the glass becomes a planter: from forest, to home, and back to nature.'},
      {id: 'giving', name: 'Giving back', text: 'I lead a six-person team. We partnered with Wanda Corporation and Kids Castle, and donated all $7,000 in profits to UNICEF and a children’s vision program.'},
    ],
    rankings: [
      {value: '$7K', label: 'Donated to charity'},
      {value: 'Gold', label: 'MUSE, Student Product Design'},
      {value: 'Silver', label: 'MUSE, Emotional & Well-Being'},
    ],
    color: '#f6ead0', symbol: 'candle', layout: {wide: [.62, .36], tall: [-.5, -.1]},
    projects: [project('eurus', {title: 'Euros Sustainable Candles'})],
  },
  {
    id: 'arts', face: 'laugh', name: 'Arts & Music', tagline: 'Violin, voice and the stage',
    color: '#f8bfca', symbol: 'music', layout: {wide: [-.64, -.42], tall: [.5, -.1]},
    islets: [
      // Collage pages with spaces for photos and videos, waiting for real ones. Words from the old site, in first person.
      {
        id: 'violin', course: 'violin', face: 'wink', name: 'Violin', tagline: 'Orchestra and section leading',
        why: 'Listen across the orchestra.',
        photos: [
          {empty: true, caption: 'Lawrenceville orchestra.'},
          {empty: true, caption: 'Dulwich orchestra.'},
          {empty: true, slot: 'Video to add', caption: 'Solo recording.'},
          {empty: true, caption: 'Leading the second violins.'},
          {empty: true, caption: 'MADD festival.'},
          {empty: true, slot: 'Video to add', caption: 'Ensemble recording.'},
        ],
        phonePhotos: [0, 2, 4],
        // Music stands, staggered so they read as a little orchestra pit rather than a column.
        photoSpots: {...COLUMN_SPOTS, wide: [[.085, .2], [.2, .5], [.085, .78], [.915, .2], [.8, .5], [.915, .78]]},
        stories: [
          {id: 'orchestra', name: 'Orchestra', text: 'I played violin in the Lawrenceville and Dulwich orchestras.'},
          {id: 'section', name: 'Section leader', text: 'As second violin section leader, I organized rehearsals and worked across sections.'},
          {id: 'stage', name: 'On stage', text: 'I performed at the MADD festival. My solo and ensemble recordings keep different parts of this music.'},
        ],
        rankings: [
          {value: '2', label: 'Orchestras'},
          {value: '2nd violins', label: 'Section leader'},
          {value: 'MADD', label: 'Festival'},
        ],
      },
      {
        id: 'vocal', course: 'vocal', media: 'council', face: 'laugh', name: 'Vocal', tagline: 'Competitions, a band and songs at home',
        why: 'A song, and the people around it.',
        photos: [
          'council-film-02',
          {empty: true, caption: 'Singing competition.'},
          {empty: true, slot: 'Video to add', caption: 'Competition performance.'},
          {empty: true, caption: 'With the band.'},
          {empty: true, caption: 'Singing at home.'},
          {empty: true, slot: 'Video to add', caption: 'Music at home.'},
        ],
        phonePhotos: [0, 1, 4],
        captions: {council_film_02_mp4: 'Singing with the band at Karaoke Night.'},
        photoSpots: COLUMN_SPOTS,
        stories: [
          {id: 'competitions', name: 'Competitions', text: 'I sang in singing competitions.'},
          {id: 'band', name: 'The band', text: 'My friends and I made a band for Chinese Society’s Karaoke Night.'},
          {id: 'home', name: 'At home', text: 'Away from the stage, I sing and play music at home with my family.'},
        ],
        rankings: [],
      },
      {
        id: 'theatre', course: 'theatre', face: 'surprised', name: 'Theatre', tagline: 'A Macbeth musical on stage',
        why: 'Macbeth, on stage.',
        photos: [
          {empty: true, caption: 'Macbeth on stage.'},
          {empty: true, caption: 'Rehearsal.'},
          {empty: true, slot: 'Video to add', caption: 'The performance.'},
          {empty: true, caption: 'Backstage.'},
          {empty: true, caption: 'The cast.'},
          {empty: true, caption: 'Curtain call.'},
        ],
        phonePhotos: [0, 2, 5],
        photoSpots: COLUMN_SPOTS,
        stories: [
          {id: 'macbeth', name: 'Macbeth', text: 'I performed in a musical production of Macbeth.'},
          {id: 'music', name: 'Music on stage', text: 'Theatre brings together the singing and playing on the Violin and Vocal islets.'},
        ],
        rankings: [],
      },
    ],
    projects: [
      project('council', {key: 'violin', title: 'Violin', role: 'Violinist & Second Violin Section Leader', pageIndexes: [0], stats: []}),
      project('council', {
        key: 'vocal', title: 'Vocal', role: 'Singer', pageIndexes: [1, 2], stats: [],
        pagePhotos: {0: {film: 'council-film-02', media: 'council', caption: 'Singing with the band at Karaoke Night.'}},
      }),
      project('arts', {key: 'theatre', title: 'Theatre', stats: [], reword: body => body.replace('the neighboring Music Studio', 'the Violin and Vocal islets')}),
    ],
  },
  {
    id: 'community', face: 'laugh', name: 'Community', tagline: 'Five islets of people and service',
    color: '#a9dc9b', symbol: 'community', layout: {wide: [0, -.5], tall: [-.5, -.5]},
    isletSpots: {wide: [[-3.6, .4], [-1.85, -.7], [1.85, -.7], [3.6, .4], [0, .55]], tall: [[-1.14, -4.2], [1.14, -4.2], [-1.14, 2.5], [1.14, 2.5], [0, -17]]},
    islets: [
      {
        id: 'chinese-society', course: 'society', media: 'culture', face: 'laugh', name: 'Chinese Society', tagline: 'Lunar New Year, mooncakes and calligraphy',
        // Words from the old site and resume, in first person.
        why: 'As president, I led a 12-member board serving more than 175 students.',
        photos: [
          {src: './assets/photos/society-lanterns.jpg', print: './assets/photos/society-lanterns-print.jpg', caption: 'Decorating paper lanterns for Lunar New Year.'},
          {src: './assets/photos/society-lion-dance.jpg', print: './assets/photos/society-lion-dance-print.jpg', caption: 'Lion dance on stage.'},
          {src: './assets/photos/society-dumplings-serving.jpg', print: './assets/photos/society-dumplings-serving-print.jpg', caption: 'Serving dumplings.'},
          {src: './assets/photos/society-dumplings-room.jpg', print: './assets/photos/society-dumplings-room-print.jpg', caption: 'Everyone together over dumplings.'},
          'culture-photo-080',
          {src: './assets/photos/society-mooncakes.jpg', print: './assets/photos/society-mooncakes-print.jpg', caption: 'Getting ready to make mooncakes.'},
          {src: './assets/photos/society-karaoke.jpg', print: './assets/photos/society-karaoke-print.jpg', caption: 'Singing with the band at Karaoke Night.'},
          'culture-film-01',
        ],
        // Shown on the scrolling film strip instead of as floating prints.
        filmStrip: true,
        photoSpots: {wide: [], tall: [], notesWide: [[.26, .53], [.42, .53], [.58, .53], [.74, .53]], notesTall: [[.27, .615], [.73, .615], [.27, .775], [.73, .775]]},
        // Same order as the symbols in society.js.
        stories: [
          {id: 'lunar', name: 'Lunar New Year Dinner', text: 'I organized our Lunar New Year Dinner for the Chinese Society.'},
          {id: 'mooncake', name: 'Mooncake Workshop', text: 'I organized a Mooncake Workshop for the Mid-Autumn Festival.'},
          {id: 'karaoke', name: 'Karaoke Night', text: 'I organized a Karaoke Night for our members, and my friends and I formed a band just for it.'},
          {id: 'calligraphy', name: 'Calligraphy', text: 'I wrote Spring Festival couplets by hand with brush and ink, and shared them with teachers.'},
        ],
        rankings: [
          {value: '175+', label: 'Students served'},
          {value: '12', label: 'Board members'},
          {value: '70+', label: 'At our largest event'},
        ],
      },
      {
        id: 'civic', course: 'civic', media: 'civic', face: 'surprised', name: 'Civic Life', tagline: 'Advocacy and public service',
        why: 'Hutchins Scholar at The Lawrenceville School.',
        photos: [
          {src: './assets/photos/civic-testimony.jpg', print: './assets/photos/civic-testimony-print.jpg', short: 'Statehouse testimony.', caption: 'My teammate and me testifying at the New Jersey Statehouse.'},
          'civic-photo-001',
          {src: './assets/photos/civic-statehouse.jpg', print: './assets/photos/civic-statehouse-print.jpg', short: 'Statehouse.', caption: 'At the statehouse.'},
          'civic-photo-112',
          {src: './assets/photos/civic-day-table.jpg', print: './assets/photos/civic-day-table.jpg', short: 'Civic Day table.', caption: 'At the Civic Day table.'},
          {src: './assets/photos/civic-day-mission.jpg', print: './assets/photos/civic-day-mission.jpg', caption: 'At Civic Day.'},
          {src: '../dist/assets/media/images/civic-photo-002.jpg', print: '../dist/assets/media/images/civic-photo-002.jpg', short: 'Group activity.', caption: 'Hutchins group activity.'},
          // Plays from the button on the Reaching people note, so it has no print of its own.
          {src: './assets/videos/civic-awareness.mp4', print: './assets/videos/civic-awareness-poster.jpg', film: true, noPrint: true, caption: 'My surveillance-awareness video, screened at Civic Day.'},
        ],
        phonePhotos: [0, 4, 2, 7],
        captions: {civic_photo_001_jpg: 'Hutchins Scholars.', civic_photo_112_jpg: 'At Penn.'},
        photoSpots: {wide: [[.175, .66], [.105, .245], [.735, .765], [.905, .765], [.895, .24], [.735, .505], [.905, .505]], tall: [[.17, .25], [.5, .25], [.83, .25]], notesTall: [[.17, .655], [.5, .655], [.83, .655]]},
        // From the resume, which has the latest details.
        stories: [
          {id: 'hutchins', name: 'Hutchins Scholars', text: 'I was selected as one of 18 students from a class of 250 for a program in social justice, civic engagement and community organizing.'},
          {id: 'bill', name: 'Bill A5483', text: 'I led advocacy for this New Jersey bill on license plate reader surveillance and data privacy. My teammate and I testified before the Assembly Public Safety and Preparedness Committee.'},
          {id: 'reach', name: 'Reaching people', text: 'I gathered about 200 petition signatures and produced a surveillance-awareness video, screened at Civic Day for an estimated 1,000+ students and faculty.', watch: 'Watch the video'},
        ],
        rankings: [
          {value: '18 of 250', label: 'Hutchins Scholars'},
          {value: '~200', label: 'Petition signatures'},
          {value: '1,000+', label: 'Civic Day audience'},
          {value: '', label: 'McClellan Society'},
        ],
      },
      {
        id: 'student-gov', course: 'council', media: 'civic', face: 'wink', name: 'Student Government', tagline: 'Student council, formals and a student store',
        why: 'Student Council President at Dulwich College Beijing.',
        photos: ['civic-photo-070', 'civic-photo-101', 'civic-photo-100', 'civic-photo-068', 'civic-photo-062', 'civic-photo-064'],
        phonePhotos: [0, 1, 2],
        captions: {civic_photo_070_jpg: 'The event team.', civic_photo_101_jpg: 'The formal dinner.', civic_photo_100_jpg: 'On stage.', civic_photo_068_jpg: 'The sign-in display.', civic_photo_062_jpg: 'Setting up.', civic_photo_064_jpg: 'At the backdrop.'},
        photoSpots: {wide: [[.175, .66], [.105, .245], [.895, .24], [.735, .49], [.905, .49], [.82, .775]], tall: [[.17, .25], [.5, .25], [.83, .25]], notesTall: [[.17, .655], [.5, .655], [.83, .655]]},
        // Words from the old site and resume, in first person. House roles live on the Kirby House page.
        stories: [
          {id: 'council', name: 'Student Council', text: 'As Student Council President and Year Group Leader, I led more than 20 student representatives.'},
          {id: 'store', name: 'The student store', text: 'Through the council and our student-run store, I built business plans, sourced wholesale inventory and used ticket presales to cover upfront costs.'},
          {id: 'formals', name: 'The formals', text: 'As Formal Committee Chair, I ran three formals for 300 students and raised RMB 160K, handling budgets, sourcing, ticket sales and vendors.'},
        ],
        rankings: [
          {value: '20+', label: 'Representatives led'},
          {value: '3', label: 'Formals'},
          {value: '300', label: 'Students'},
          {value: 'RMB 160K', label: 'Raised'},
        ],
      },
      {
        id: 'kindergarten', course: 'care', media: 'daycare', face: 'laugh', name: 'Kindergarten', tagline: 'Daycare and volunteer teaching',
        why: 'Care is in the everyday details.',
        // Guizhou's classrooms belong to the Glasses story, so this page only links to it.
        photos: ['daycare-film-01', 'daycare-photo-097', 'daycare-photo-019', 'daycare-photo-029', 'daycare-photo-030', 'daycare-photo-028', 'daycare-photo-009'],
        phonePhotos: [1, 3, 5],
        captions: {daycare_film_01_mp4: 'Story time at Loveland.', daycare_photo_097_jpg: 'Reading together.', daycare_photo_019_jpg: 'A little company.', daycare_photo_029_jpg: 'A birthday at Loveland.', daycare_photo_030_jpg: 'Little celebrations.', daycare_photo_028_jpg: 'A day outdoors.', daycare_photo_009_jpg: 'Time with a family.'},
        photoSpots: {wide: [[.175, .66], [.105, .245], [.905, .775], [.895, .24], [.735, .49], [.905, .49], [.735, .775]], tall: [[.17, .25], [.5, .25], [.83, .25]], notesTall: [[.17, .655], [.5, .655], [.83, .655]]},
        // Words from the old site and resume, in first person.
        stories: [
          {id: 'loveland', name: 'Loveland Daycare', text: 'Over four summers at an independent childcare center in Beijing, I progressed from volunteer to paid assistant.'},
          {id: 'days', name: 'Everyday care', text: 'I led reading, English lessons and activities for children aged one to five, and helped with meals and daily routines.'},
          {id: 'guizhou', name: 'Guizhou', text: 'Teaching in Guizhou is where the story behind my glasses began.', link: {href: '#/glasses', label: 'Read the story →'}},
        ],
        rankings: [
          {value: '4', label: 'Summers at Loveland'},
          {value: 'Ages 1–5', label: 'Children I cared for'},
          {value: '', label: 'Volunteer to paid assistant'},
        ],
      },
      {
        id: 'kirby', course: 'kirby', face: 'wink', name: 'Kirby House', tagline: 'House life and mentoring at Lawrenceville',
        why: 'Kirby House Prefect at The Lawrenceville School.',
        // Empty until there are real pictures; the captions say what each one is waiting for.
        photos: [
          {src: './assets/photos/kirby-house.jpg', print: './assets/photos/kirby-house-print.jpg', caption: 'Kirby House together.'},
          {src: './assets/photos/kirby-orientation.jpg', print: './assets/photos/kirby-orientation-print.jpg', caption: 'Kirby orientation.'},
          {src: './assets/photos/kirby-red.jpg', print: './assets/photos/kirby-red-print.jpg', caption: 'Kirby in red.'},
          {src: './assets/photos/kirby-leah-welty.jpg', print: './assets/photos/kirby-leah-welty-print.jpg', caption: 'Leah Welty Award.'},
          {src: './assets/photos/kirby-flowers.jpg', print: './assets/photos/kirby-flowers-print.jpg', short: 'Flower truck.', caption: 'The flower truck at Kirby orientation.'},
          {src: './assets/photos/kirby-tiedye.jpg', print: './assets/photos/kirby-tiedye-print.jpg', caption: 'Kirby pride.'},
        ],
        phonePhotos: [1, 3, 0],
        photoSpots: {wide: [[.105, .245], [.095, .7], [.265, .7], [.91, .295], [.735, .7], [.91, .7]], tall: COLUMN_SPOTS.tall, notesTall: [[.17, .655], [.5, .655], [.83, .655]]},
        // House facts from the school's archive (stephanarchives.org/house-histories); the rest from the old site, in first person.
        stories: [
          {id: 'house', name: 'The house', text: 'Kirby is one of the girls’ Crescent Houses at The Lawrenceville School. It was built in 1987 and is named for the Kirby family.'},
          {id: 'role', name: 'My role', text: 'As prefect, I ran Kirby’s orientation and mentor 40+ younger girls in academics, House life and wellbeing. I voice student needs in weekly meetings with deans, House heads and alumni, and was House Wellness Representative in Grade 11.'},
          {id: 'award', name: 'Leah Welty Award', text: 'I received the Leah Welty Award in Grade 11 (2025–26), as one of two annual recipients recognized for exceptional House leadership and service.'},
        ],
        rankings: [
          {value: '40+', label: 'Younger girls mentored'},
          {value: 'Weekly', label: 'Student advocacy meetings'},
        ],
      },
    ],
    projects: [
      project('culture', {key: 'chinese-society', title: 'Chinese Society'}),
    ],
  },
  {
    id: 'sports', face: 'surprised', name: 'Sports', tagline: 'Basketball, golf and soccer',
    color: '#9edc7e', symbol: 'sports', isletSpots: {wide: [[-2, -.45], [0, .6], [2, -.45]], tall: [[-1.14, -4.2], [0, 2.5], [1.14, -4.2]]}, layout: {wide: [.64, -.42], tall: [.5, -.5]},
    islets: [
      {
        id: 'basketball', course: 'court', face: 'surprised', name: 'Basketball', tagline: 'Captain, coaching and third in ISAC',
        // First-person draft from Niki's resume, to be put into her own words.
        why: 'Varsity captain at Dulwich College Beijing.',
        photos: ['basketball-photo-071', 'basketball-film-03', 'basketball-photo-108', 'basketball-film-02', 'basketball-photo-102', 'basketball-film-04'],
        photoSpots: COLUMN_SPOTS,
        captions: {
          basketball_photo_071_jpg: 'Getting ready for tip-off.',
          basketball_photo_102_jpg: 'The team during a trophy presentation.',
          basketball_photo_108_jpg: 'The team with our trophy.',
          basketball_film_03_mp4: 'Highlights from our games.',
          basketball_film_02_mp4: 'Game footage.',
          basketball_film_04_mp4: 'More game footage.',
        },
        stories: [
          {id: 'captain', name: 'Captain', text: 'I captained the varsity team from 2022 to 2024, and we placed third in ISAC.'},
          {id: 'coaching', name: 'Coaching', text: 'I also assisted with basketball coaching.'},
          {id: 'award', name: 'Coaches’ Award', text: 'I received the Junior Varsity Coaches’ Award in 2022–23.'},
        ],
        rankings: [
          {value: 'Captain', label: 'Dulwich varsity, 2022–24'},
          {value: '3rd', label: 'ISAC'},
          {value: 'Award', label: 'JV Coaches’, 2022–23'},
        ],
      },
      {
        id: 'golf', course: 'golf', face: 'wink', name: 'Golf', tagline: 'Varsity golf and First Tee mentoring',
        // An id from the old site's archive, or a picture of its own. `print` is a closer crop for the floating print.
        photos: [
          'golf-photo-046', 'golf-photo-005',
          {src: './assets/photos/golf-team-sunset.jpg', print: './assets/photos/golf-team-sunset-print.jpg', caption: 'My teammates and me at sunset at the Girls Red Devils Invitational.'},
          'golf-photo-025', 'golf-photo-109', 'golf-photo-027',
          {src: './assets/photos/golf-team-coach.jpg', print: './assets/photos/golf-team-coach-print.jpg', caption: 'The team together with their coach.'},
        ],
        // Sticker tags under the island. The rest of the record opens on the scorecard.
        rankings: [
          {value: '#3', label: 'Varsity team, 2025–26'},
          {value: '#107', label: 'New Jersey state ranking'},
          {value: '1st', label: 'Best individual round'},
        ],
        // First-person draft from Niki's notes, to be put into her own words.
        why: 'For me, golf is about the people I play with.',
        stories: [
          {id: 'family', name: 'Family', text: 'On holidays, I play with my family. Golf is how we spend time together.'},
          {id: 'firsttee', name: 'First Tee', text: 'I mentor kids through First Tee at Lawrenceville, teaching them everything from their grip to course etiquette. I love sharing the game with them.'},
          {id: 'team', name: 'My team', text: 'At school, golf is how I bond with my team. We compete together, and we are close.'},
        ],
        record: {
          team: 'Varsity Golf, The Lawrenceville School · August 2024 to present',
          tournaments: [
            // Earliest first. Only the two years are known so far.
            {name: '2025 NJ Prep A & B Championships', team: '2nd of 12', individual: '21st of 50'},
            {name: '15th Annual Swing Against Cancer – Girls', team: '3rd', individual: '9th'},
            {name: 'Girls Red Devils Invitational', team: '4th', individual: '22nd'},
            {name: '2026 Mid-Atlantic Prep League Girls’ Championship', team: '3rd', individual: '17th'},
            {name: '2026 NJ Prep A & B Girls’ Championship', team: '2nd of 12', individual: '20th of 50'},
          ],
          stats: [{value: '27', label: 'rounds played, all seasons'}, {value: '8.366', label: 'iWR (iWanamaker Rating)'}],
          statNote: 'iWR compares my score with how hard each course is rated. Lower is better, and it counts strokes above the course rating, adjusted for difficulty.',
          mentor: {
            title: 'Youth Golf Mentor, First Tee',
            when: 'The Lawrenceville School · August 2025 to present',
            text: 'I help young players learn the fundamentals: grip, stance, alignment, swing mechanics, putting and short-game control. I also support their practice drills and teach them course etiquette.',
          },
        },
      },
      {
        id: 'soccer', media: 'football', course: 'pitch', face: 'laugh', name: 'Soccer', tagline: 'Goalie, left wing and midfield',
        // First-person draft from Niki's notes and resume, to be put into her own words.
        why: 'I started playing when I was 8, and I played until 2025.',
        photos: ['football-photo-090', 'football-photo-091', 'football-photo-103', 'football-photo-105', 'football-photo-104', 'football-photo-106'],
        photoSpots: COLUMN_SPOTS,
        captions: {
          football_photo_090_jpg: 'In goal during a match.',
          football_photo_091_jpg: 'The team outside school.',
          football_photo_103_jpg: 'The team by the goal.',
          football_photo_104_jpg: 'Players and coaches on the pitch.',
          football_photo_105_jpg: 'A team huddle.',
          football_photo_106_jpg: 'Greeting the other team after a match.',
        },
        stories: [
          {id: 'dulwich', name: 'Dulwich College Beijing', text: 'I captained the varsity soccer team from 2022 to 2024.'},
          {id: 'lawrenceville', name: 'Lawrenceville', text: 'I played one more year here, during my sophomore year.'},
          {id: 'positions', name: 'My positions', text: 'I played as a goalie, and also at left wing and in midfield.'},
        ],
        rankings: [
          {value: 'Age 8', label: 'When I started'},
          {value: 'Captain', label: 'Dulwich varsity, 2022–24'},
          {value: '', label: 'Goalie, left wing and midfield'},
        ],
      },
    ],
    projects: [project('basketball'), project('golf'), project('football', {key: 'soccer', title: 'Soccer', role: 'School Soccer Player', stats: []})],
  },
];

// Smaller extras in the same sea. Their pages are placeholders until the real text arrives.
export const EXTRAS = [
  {
    id: 'about', course: 'about', face: 'wink', name: 'About', tagline: 'Who is Niki?', small: true,
    color: '#f5dfaf', symbol: 'lighthouse', layout: {wide: [.33, .72], tall: [.8, .68]},
    why: 'Who is Niki?',
    // First drafts from what's elsewhere on the site, for Niki to put in her own words.
    stories: [
      {id: 'me', name: 'About me', text: 'Hi, I’m Niki. I’m originally from Beijing and now a student at The Lawrenceville School. I like taking a question apart and building something that answers it: maps of how two cities grew apart, glasses that help blind people find their way, candles that give back to a forest.'},
      {id: 'hobbies', name: 'Hobbies', text: 'Away from school, I play golf with my team, spend time with the kids at the kindergarten and cook.'},
    ],
    // Spaces for photos, waiting for real pictures.
    photos: ['Golf', 'Kindergarten', 'Cooking', 'Daily life', 'Friends', 'Family', 'Travel', 'Beijing'].map(name => ({empty: true, caption: `${name}.`})),
    phonePhotos: [0, 1, 2],
    // Notes down the left, the lighthouse in the middle, photos in a grid on the right.
    photoSpots: {wide: [[.775, .25], [.905, .27], [.78, .52], [.91, .54], [.775, .79], [.905, .8], [.095, .83], [.235, .84]], tall: [[.17, .25], [.5, .25], [.83, .25]], notesWide: [[.165, .15], [.165, .46]], notesTall: [[.28, .6], [.72, .6]]},
    rankings: [],
  },
  {
    id: 'contact', face: 'laugh', name: 'Say hi', tagline: 'Message in a bottle', small: true,
    color: null, symbol: 'bottle', layout: {wide: [-.3, .7], tall: [-.8, .68]},
    note: 'Want to talk about Feel to Read, the Daqing film, or anything else here? Write to me.',
    email: 'nikil26priv@gmail.com',
  },
];
