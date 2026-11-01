# Original image archive

The website uses 110 photographs from the supplied `resource` folder and all seven pages of `Eurus-Design-Portfolio.pdf`. Six exact duplicate files and five clearly duplicated photographs were consolidated. No source files were changed.

- `source-images.json`: source-to-destination map, including duplicate decisions and PDF page numbers.
- `source-image-inventory.json`: review IDs, SHA-256 hashes, dimensions and relative source paths for all 121 original image files.
- `build_images.py`: reproducible JPEG/thumbnail export; reads `../resource` relative to the project parent.
- `../dist/media-images.js`: browser-ready, English-only titles, captions and activity categories.

Run `python3 media/build_images.py` from the project root to rebuild. It requires Pillow, PyMuPDF and `heif-convert` on PATH. HEIC intermediate decoding uses the operating system temporary directory. Full images are limited to 1600 pixels on the longest edge; thumbnails to 440 pixels. JPEG exports omit source EXIF metadata.

The original application documents, exam materials and other private paperwork are not part of this archive. The supplied candle design portfolio is retained as an original project artifact. Media categories use the supplied folder context and visual review, without inferring the identities of other people pictured.
