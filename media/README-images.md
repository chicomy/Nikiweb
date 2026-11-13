# Original image archive

The website uses 110 photographs from the supplied `resource` folder and all seven pages of `Eurus-Design-Portfolio.pdf`. Six exact duplicate files and five clearly duplicated photographs were consolidated. No source files were changed.

- `source-images.json`: source-to-destination map, including duplicate decisions and PDF page numbers.
- `source-image-inventory.json`: review IDs, SHA-256 hashes, dimensions and relative source paths for all 121 original image files.
- `build_images.py`: reproducible JPEG/thumbnail export; reads `../resource` relative to the project parent.
- `../dist/media-images.js`: browser-ready, English-only titles, captions and activity categories.

Run `python3 media/build_images.py` from the project root to rebuild. It requires Pillow, PyMuPDF and `heif-convert` on PATH. HEIC intermediate decoding uses the operating system temporary directory. Full images are limited to 1600 pixels on the longest edge; thumbnails to 440 pixels. JPEG exports omit source EXIF metadata.

The original application documents, exam materials and other private paperwork are not part of this archive. The supplied candle design portfolio is retained as an original project artifact. Media categories use the supplied folder context and visual review, without inferring the identities of other people pictured.

## Sea website audit — 2026-11-13

All 121 original images still match their inventory hashes. The website already contained their 110 retained photographs and seven portfolio pages; the omissions were in the new sea pages' selections. We replaced 27 empty featured slots and one story-photo placeholder with existing, verified media. Missing prototype and medical-story photographs are not substituted with unrelated people or events; unfilled story-photo placeholders are not rendered.

Every sea destination now has a **Gallery** button with its full relevant photo and film collection. The gallery includes the existing sea-specific photographs, renders small thumbnails first, and opens full photos and videos on demand. Phone layouts keep their selected floating prints while the same complete collection stays accessible in the gallery.

| Destination | Photos / design pages | Films |
| --- | ---: | ---: |
| Glasses and volunteer-teaching story | 19 | 1 |
| Divided by 101 | 7 | 0 |
| Daqing documentary fieldwork | 5 | 2 |
| Candle design and fundraising | 28 | 10 |
| Violin | 8 | 10 |
| Vocal | 6 | 5 |
| Theatre | 6 | 0 |
| Chinese Society and calligraphy | 10 | 1 |
| Civic learning | 7 | 1 |
| Student government and school events | 11 | 0 |
| Daycare and volunteer teaching | 20 | 1 |
| Kirby House | 6 | 0 |
| Basketball | 4 | 4 |
| Golf | 16 | 2 |
| Soccer | 10 | 0 |
| About | 8 | 0 |

Counts overlap where an existing photograph supports both an activity and the About/story page. All 117 archived images/design pages and all 36 archived films are reachable, alongside the sea-specific media. Each gallery removes repeated file URLs. The 11 intentionally consolidated original-image duplicates remain excluded.

Still unavailable or not reliably identified in the supplied files: the finished Daqing documentary and screening photographs; glasses prototype, testing, interview and pilot photographs; photographs confirmed to show Wei or his post-surgery recovery. Performance photos use their verified archive captions instead of assuming a particular orchestra, festival or backstage setting.

Run `node media/audit-sea-media.mjs` to check archive coverage, local asset existence, phone selections and deployment paths. Browser checks cover desktop and 390 × 844 layouts, photo enlargement, keyboard navigation, gallery dismissal, complete mobile galleries, and About's portrait/landscape change. After deployment, all 362 unique gallery image, thumbnail, poster and video URLs returned HTTP 200 with the expected content type; the seven changed runtime files matched local source exactly, and both video routes returned the correct 1 KiB range with HTTP 206.
