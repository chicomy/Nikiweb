# Culture and arts miniatures

Three original Blender models replace the earlier procedural portfolio icons. All are Y-up in the exported GLBs, grounded at Y=0, and face +Z. Source scenes use Blender Z-up with front −Y.

- `playhouse.blend`: an open vaulted theatre with genuine interior space, fluted pilasters, sculpted pleated curtains, gold-edged swags, floorboards, a lighting rig, performers and upholstered audience seating.
- `music-studio.blend`: a carved violin with separate ribs, arched plates, double purfling, shallow f-hole inlays, bridge, four strings, tailpiece, chinrest, pegs, scroll, bow and instrument stand. The grand piano has a curved rim, exposed string bed, raised lid, keyboard, pedals, legs and bench.
- `culture-pavilion.blend`: a double hipped pavilion with concave tiled roofs, raised hip ridges, timber brackets, open railings, columns, ribbed lanterns, bamboo brush with individual bristles, inkstone, seal and open scroll.
- `*-preview.png`: studio renders inspected during creation.
- `*-metadata.json`: exported bounds, triangle counts and mesh counts.
- `build_culture_arts.py`: self-contained construction, export and studio render script.

Meshes are merged by material, with softened hard edges and angle-based smooth normals. The models use only original geometry and color materials; there are no external image textures or downloaded model assets.

Run from the project folder with Blender 5.2.2:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/culture-arts/build_culture_arts.py
```

To rebuild one model, append `-- playhouse`, `-- music-studio` or `-- culture-pavilion`. GLBs export to `dist/models/`. The saved `.blend` scenes include the studio camera and lights; these are excluded from the GLBs.
