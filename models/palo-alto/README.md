# Palo Alto landmark models

These are original, editable miniature models created in Blender 5.2.2 for Niki's world. Their characteristic architecture is based on official reference photographs; they are selective compositions, not measured architectural surveys.

- `stanford-campus.blend`: Main Quad-inspired sandstone arcades and tiled roofs, Memorial Church-inspired façade and rose window, Hoover Tower with octagonal observation stage and red tiled dome, and a compact Oval/Palm Drive composition.
- `hp-garage.blend`: Cedar-shingled garage with green trim, framed double doors, metal hinges, window mullions, workbench and oscillator-inspired instrument, picket fence and historical marker.
- `build_landmarks.py`: Reproduces both assets and studio previews.
- `*-metadata.json`: Exact exported bounds, mesh/material count and triangle count.
- `*-preview.png`: Rendered and visually inspected studio previews.

Run from the `niki-city` project folder:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python models/palo-alto/build_landmarks.py
```

Exports are written to `dist/models/`. Models use geometry and color materials only, with no downloaded photographic textures. Front façades face Blender −Y, exported glTF +Z; the ground is glTF Y=0. Meshes are merged by material to reduce draw calls. The .blend documents retain their studio render setup; exported GLBs contain only the asset meshes.

## References

- Stanford University Architect, Hoover Tower: https://architectplanning.stanford.edu/hoover-tower
- Stanford visitor information and campus landmarks: https://www.stanford.edu/life/visit
- HP, garage restoration description: https://www.hp.com/hpinfo/abouthp/histnfacts/garage/pastperfected.html
- HP, garage archival reference sheet: https://www.hp.com/hpinfo/abouthp/histnfacts/garage/brief.pdf
- Hewlett-Packard Company Archives, Returning to Addison Avenue: https://www.hewlettpackardhistory.com/collection/returning-to-addison-avenue/

The files under `references/` are visual-study references from their respective publishers, not textures used by the website. They need not be included in a website/source distribution.
