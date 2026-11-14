# Niki's World — Across 101

An independent, desktop-first Three.js portfolio. Explore a miniature of Palo Alto and East Palo Alto, discover Niki's projects, and inspect their detailed 3D models. All interface and portfolio copy is English. The experience lives in the city, with in-world exhibition boards and small game controls.

Live website: [niki.ing](https://niki.ing). Source repository: [chicomy/Nikiweb](https://github.com/chicomy/Nikiweb).

The current homepage is **Niki's Sea**, the island portfolio in `sea/`. Run `python3 sea/dev-server.py` and open http://127.0.0.1:4175/sea/ for local preview, including **Edit text** and saving to `sea/text-edits.json`. The editor is hidden on public hosts. The city version described below remains in `dist/` and supplies shared models, media, fonts and libraries to the sea.

Each island's **Gallery** opens its complete photos and films, including on phones. See `media/README-images.md` for the source audit, destination counts and the remaining unavailable photographs. Run `node media/audit-sea-media.mjs` to verify that every retained archived item stays accessible.

The repository includes the complete website in `dist/`, Cloudflare deployment configuration, a local preview server, and model-generation scripts. Original source media, media inventories, editable `.blend` files, backups, build logs, and preview renders remain local authoring materials; they are not required to run or deploy the website. The model-generation scripts can recreate the editable Blender scenes.

## Run locally

On macOS, double-click `Start Niki World.command`. Or run:

```sh
python3 serve.py
```

Then open http://127.0.0.1:4173/. The site requires an HTTP server because it uses ES modules; opening `index.html` directly from Finder is not sufficient. Libraries, fonts, photographs, films and GLB models are bundled locally. The included localhost server supports HTTP byte ranges so films can seek without downloading them from the beginning. Blender is only needed to edit or rebuild model sources.

## Explore and inspect

- Click a building or its pin to read its story. Pins expand to names on hover.
- Choose **VIEW 3D MODEL** on a story board to inspect the model. Drag to rotate and scroll to zoom. **Field notes** returns to the story; **City map** returns to the overview.
- WASD or arrow keys: walk. E: enter a nearby place.
- The map and model views open straight-on with a mild downward angle. Drag to orbit, Shift-drag to pan, and scroll to zoom; R restores the frontal overview.
- P: open the field passport. C: show imagined connections across 101.
- R: return to the whole city. F: fullscreen. Esc closes the current story or model view.
- While reading, left/right arrows turn pages. Click a photograph to enlarge it within the world.
- **OPEN ARCHIVE** opens each activity’s photo and film collection. Filter All / Images / Films, browse six items per sheet, and click any item to view it. Returning preserves the archive page and filter.
- Films play on a large screen inside the city. Click the progress bar to seek; Space toggles playback, left/right seek ten seconds, M toggles sound, and Esc returns to the archive. Leaving a film stops playback and releases the source.
- The pause control freezes city and model motion. The experience also respects the browser's reduced-motion preference.

The passport contains **13 Niki project destinations** in six themes. The Hewlett-Packard Garage is a separate contextual landmark; visiting it does not change the passport count. Stanford is omitted from the current map and is not loaded by the runtime. Its editable source remains available for future use.

Basketball, golf and football have separate destinations, activity pages, photographs and passport stamps. A previous Sports Park stamp migrates to these three entries. Basketball opens as a courtside tactics board; golf opens as a course book with a player card. Other destinations use related presentation objects, including a research atlas, design blueprint, documentary notes, culture scroll, music notebook and theatrical playbill. Photos can be enlarged and closed without losing the current page.

Visited projects are saved locally in the browser. There is no account, tracking, backend or hosting-provider dependency.

## Photo and film archive

The archive contains **110 photographs, seven pages of the Eurus design portfolio, and all 36 supplied videos** (about 42 minutes 12 seconds), grouped into twelve of the thirteen project destinations. No media is assigned to the research gateway without a relevant supplied source. Six byte-identical photos and five repeated versions of the same image are consolidated.

Photos have separate thumbnails and full views. Videos preserve their complete duration and audio, use H.264/AAC MP4 with faststart, and load only when opened. The original 1.50 GB of video is reduced to approximately 358.8 MiB; images and thumbnails use approximately 35.9 MB. Original files under the sibling `resource` folder are untouched. The browser fetches only the six thumbnails on the current sheet, and the image cache is bounded.

The local `media/source-images.json` and `media/source-videos.json` files retain provenance, duplicate decisions and validation results. The scripts in `media/` rebuild the optimized derivatives when the original resource folder, local image inventory, and their documented media tools are available. Source inventories and logs are excluded from Git. The static `dist` folder contains everything needed for normal viewing.

## Detailed models and motion

All thirteen portfolio destinations use Blender-built GLB models. Together with the HP Garage, the runtime loads fourteen models.

| Destination | Model and characteristic details |
| --- | --- |
| Candle Atelier | Photo-based winter botanical candle with hollow glass, fluted wax tiers, leaves, snow crystals, wick and hanging tag. |
| Feel To Read | Vision Pro-inspired curved dark visor, metal rim, fabric seal and strap, sensors and controls. This is a conceptual project sculpture, not an Apple product or a claim that Niki's working prototypes have this design. |
| Daqing research and documentary | Detailed oil pumpjack with support frame, horsehead, motor, counterweights, rod, pipes and documentary plaque. Its four-bar mechanism drives the animated beam, connecting rods and crank. |
| Divided by 101 | Detailed research gateway and highway sign with road clearance and a miniature map exhibit. |
| The Playhouse | Open vaulted theatre, pleated curtains and swags, stage floorboards, lighting rig, performers and upholstered seats. |
| Music Studio | Carved violin with purfling, strings, bridge and bow, alongside a grand piano with raised lid and exposed string bed. |
| Culture Pavilion | Curved tiled roofs, ridge ornaments, timber brackets, lanterns, brush bristles, inkstone and scroll. |
| Civic Hall | Fluted columns, layered capitals, ribbed dome, arched glazed entrance, railings and a testimony lectern with speaker. |
| Care Cottage | Terracotta tiles, masonry chimney, heart-window dormer, porch, greenhouse, flower boxes and shared bench. |
| Learning Garden | Layered open-book roof, reading shelter, individual shelf books, teacher and children, alphabet blocks and slide. |
| Basketball Court | A dedicated half-court with one hoop, complete markings and three articulated basketball players. Dribbling, shooting and defensive motion share the city clock. |
| Golf Green | A separate putting green, bunker, flag and practice features, with two participants and an animated putt. |
| Football Field | An independent miniature pitch with goals, field markings and team figures. |

The candle was modeled from the supplied product photograph; it is a hand-built reconstruction, not a photogrammetry scan. The other miniatures use original geometry and materials. The HP Garage preserves recognizable cedar shingles, green trim, workshop details, fence and historical marker. These are stylized miniatures rather than measured architectural surveys.

## Runtime structure

- `dist/world.js`: scene, player, road barrier, vehicles, picking, cameras and model inspection.
- `dist/model-assets.js`: loading and fitting the fourteen active GLB assets.
- `dist/models/`: web-ready portfolio and regional models. A retained Stanford asset, if present, is not loaded.
- `dist/industrial-motion.js`: the pumpjack's linked mechanical motion.
- `dist/sports-motion.js`: articulated basketball/golf participants and ball animation.
- `dist/landmark-models.js`: procedural fallbacks for portfolio destinations.
- `dist/map-ground.js`: roads, creek, parks, bridges, Caltrain and context buildings.
- `dist/footprints.js`: rotated ground footprints used for placement and walking collisions.
- `dist/map-reference.js`: selected OpenStreetMap geography and landmark positions.
- `dist/exhibit.js`: physical story, photograph and passport boards.
- `dist/themed-exhibits.js`: activity-specific playbooks, course book, production notes, atlas, blueprints, scroll, playbill and journals.
- `dist/media-exhibit.js`: activity-themed media contact sheets and complete-photo views.
- `dist/media-player.js`: Three.js video screen, transport controls and source cleanup.
- `dist/media-library.js`, `dist/media-images.js`, `dist/media-videos.js`: grouped local media manifests.
- `dist/main.js`: navigation, archive state, model-view controls and exploration progress.
- `serve.py`: localhost preview server with video byte-range support.
- `dist/city-content.js`: six themes, thirteen destinations and thirty-four story pages.
- `dist/region-content.js`: the HP Garage context entry, separate from the portfolio passport.
- `dist/assets/`: optimized original photographs.
- `dist/vendor/`: locally bundled Three.js, GLTFLoader, fonts and license files.

The `dist` folder is a complete static site and can be served by any static web server. No ChatGPT Site integration is configured.

## Cloudflare deployment

Production domain: **https://niki.ing**. `wrangler.jsonc` configures the `niki-world` Cloudflare Worker and its custom domain. Before deployment, Wrangler runs `python3 build-cloudflare.py`: this copies the sea website to the root of the ignored `.cloudflare-assets/` directory and includes `dist/` beneath it for shared resources. Only that generated directory is uploaded. Python 3 is required for this packaging step; no JavaScript build or package installation is needed. `cloudflare-worker.js` adds HTTP byte-range support to both `/assets/videos/*` and `/dist/assets/media/videos/*` through Cloudflare's Cache API, using each asset's ETag to prevent stale video content after an update. Other site assets are served directly. Video-path requests use the account's Workers request allowance.

To deploy an update from this project directory with Node.js installed:

```sh
npx wrangler@4.129.0 login
npx wrangler@4.129.0 deploy
```

The login command is only needed when no valid Cloudflare session is available. Credentials stay in Wrangler's local account configuration, outside this project. Do not deploy the parent student folder, source media, Blender sources, or backup files.

Each published file must remain below Cloudflare's 25 MiB static asset limit. `council-film-02.mp4` has a deployment-sized H.264 derivative with its original duration, resolution and audio preserved; its previous web derivative is retained in the ignored `media/backup/` directory. Wrangler checks file sizes before uploading. Videos load on demand and use HTTP byte ranges for seeking.

Photo switching fix on 2026-11-14 (Asia/Shanghai): version `8c81fdb7-c800-4d98-8a4a-eb4b09e1fab7`. Both photo viewers clear the previous image immediately and display the new image only after decoding. A request sequence prevents old loads from appearing after rapid navigation, closing, or switching to video. Six deterministic regressions (`node media/audit-photo-loader.mjs`) and Chrome checks with deliberately delayed/failed images passed for both viewers.

Media gallery deployment on 2026-11-13 (Asia/Shanghai): version `4dbe1b88-79a9-4af2-ac87-eb276d6a1f20`. Restored existing photos and recordings to the sea pages, added complete per-topic galleries, and fixed portrait/landscape photo selection. Native Chrome checks verified desktop and phone galleries, photo enlargement, keyboard navigation, About orientation changes, the volunteer-teaching story photo, and the published Theatre gallery. `media/README-images.md` records the source inventory and remaining unavailable material.

Initial sea deployment on 2026-11-12 (Asia/Shanghai): version `0a6d49bb-ea9f-47b9-9846-7be8d09cc0d7`. Backup address: https://niki-world.pathfive.workers.dev. Fourteen local and sixteen production HTTP checks passed, covering byte-identical HTML, scripts, styles, font, images and a GLB, both video paths returning the exact requested 1 KiB with HTTP 206, expected 404 responses, and the backup homepage.

Previous city deployment on 2026-11-02 (Asia/Shanghai): version `55d9d239-a09f-4f35-8145-4279d4b87292`.

## Rebuilding Blender models

| Source directory | Assets | Build script |
| --- | --- | --- |
| `models/candle/` | Winter candle, including a clean editable model and studio scene | `build_candle.py` |
| `models/industrial/` | Feel To Read, Daqing pumpjack, Divided by 101 gateway | `build_industrial.py` |
| `models/culture-arts/` | Playhouse, Music Studio, Culture Pavilion | `build_culture_arts.py` |
| `models/community/` | Civic Hall, Care Cottage, Learning Garden | `build_community.py` |
| `models/sports/` | Separate basketball, golf and football scenes | `build_sports.py` |
| `models/palo-alto/` | HP Garage and retained Stanford source | `build_landmarks.py` |

The repository's source folders contain model build scripts and metadata where applicable. Build scripts generate editable `.blend` scenes and local preview renders, both excluded from Git. The `.blend` files remain outside the served `dist` folder. Studio cameras and lights are excluded from web exports. Local reference files under `models/palo-alto/references/` are study references, are excluded from Git, and are not website textures.

From the project directory, use Blender 5.2.2 or a compatible version:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/candle/build_candle.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/industrial/build_industrial.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/culture-arts/build_culture_arts.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/community/build_community.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/sports/build_sports.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/palo-alto/build_landmarks.py
```

The community build uses its local `mesh_helpers.py`. The sports build currently imports mesh helpers from `models/palo-alto/build_landmarks.py`, so retain that script even while Stanford is absent from the map. Rebuilding the Palo Alto sources exports both HP Garage and Stanford; runtime selection remains controlled by `dist/model-assets.js`.

## Content and geography

Activities are grouped by theme, not application-list rank. The supplied activity list provides roles, figures and honors; folder media supports music, singing, theatre, calligraphy, basketball, football and volunteer teaching. Source application PDFs are not included in the website.

Roads, San Francisquito Creek, selected parks, Caltrain and context-building locations come from OpenStreetMap. The current map is cropped to X [−56, 40], Z [−34, 34], with an overview center at X = −8. It contains 61 road polylines and 141 context-building positions. The crop removes the distant Stanford section and retains the HP Garage within the Palo Alto street network.

The map is rotated and compressed for a miniature composition. Portfolio sculptures and the central NIKI footbridge are imagined additions, not real project addresses. Highway 101 is not the municipal boundary; the creek separates the cities in this area. The map introduces *Divided by 101* without presenting unprovided findings from the paper. See `map-reference-notes.md` for the projection, sources and ODbL attribution.

## Verification

Browser checks cover the desktop city, landmark selection, in-world stories and photographs, passport grouping, player movement, bridges, camera controls and model inspection. `window.render_game_to_text()` and `window.advanceTime(ms)` expose test hooks. Model metadata records exported bounds and geometry counts. Runtime motion follows the same paused/reduced-motion clock as the rest of the city.

Collision audits can be run with Node from the project directory:

```sh
node models/audit-layout.mjs
node models/sports/audit-motion.mjs
node models/industrial/audit_motion.mjs
```

The layout audit loads actual GLBs, checks landmark separation and reserves space around bridges and sculptures before adding context buildings. The current composition omits 14 of the 141 context-building positions to keep those spaces clear. Walking collisions include model plinths, gateway feet, background houses, tree trunks, NIKI letters and bridge rails; the central crossing remains traversable. Landmark selection changes the marker without raising the model from its base.

The sports audit samples 56 seconds of posed footwear, ball paths, court/green surfaces, rim, net, backboard and putter clearance. The industrial audit samples a full crank cycle using the exported pump geometry and checks the exposed shaft, frame and crank clearance. Intended joins such as hand grips, hinges, shafts inside sleeves and planted structural supports are retained.
