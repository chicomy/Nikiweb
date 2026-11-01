# EURUS winter botanical candle

A hand-built Blender reconstruction using the user's `resource/niki23号分享的资料/candle1.jpg` as the visual reference. This is a modeled interpretation of the photographed product, not a photogrammetry scan.

## Deliverables

- `eurus-winter-candle.blend`: clean editable product model.
- `eurus-winter-candle-studio.blend`: model with studio camera, lighting and backdrop.
- `candle-studio-preview.png`: inspected Cycles render.
- `build_candle.py`: reproducible Blender authoring script.
- `../../dist/models/eurus-candle.glb`: web-ready glTF binary, Y-up.

## Geometry and materials

Six sculpted, fluted wax tiers graduate from pine green to ivory. The vessel is a closed hollow glass shell with rolled lip and heavy heel. Preserved serrated leaves have geometric veins, and individual snow crystals decorate the lower vessel. A cotton wick and loop support the English hanging tag. A circular stone plinth and brass trim frame the product in the city.

The final model has 16 merged material meshes, 67,084 triangles and an approximately 4.2 × 5.9 × 4.2 unit envelope. The GLB is approximately 1.6 MB. It uses `KHR_materials_transmission`, `KHR_materials_ior` and `KHR_materials_clearcoat`. A studio/environment map should be supplied by the Three.js scene for the glass. The front of the product is glTF +Z.

## Rebuild

Run `Blender --background --factory-startup --python models/candle/build_candle.py` from the `niki-city` directory. The script exports the GLB and renders the studio preview. Blender 5.2.2 was used.
