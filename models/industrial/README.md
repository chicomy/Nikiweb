# Detailed industrial and research miniatures

Original editable Blender models created for Niki’s portfolio. All website exports use geometry and color materials, with no downloaded textures or brand logos.

- **feel-to-read.glb**: A conceptual accessible-navigation headset using the requested Vision Pro-like design vocabulary: continuous curved dark visor, silver frame, fabric light seal, ribbed back strap, curved upper strap, sensors, audio arms, crown, battery and tactile route dots. This visual interpretation is not a claim that Niki built an Apple product or that the project shares Apple's specifications.
- **daqing-pumpjack.glb**: A walking-beam pumpjack with horsehead, A-frame and cross-bracing, motor, reduction housing, crank counterweights, pitman rods, polished rod, wellhead bolts, pipeline, valve, ladder and safety rail. A small Rise & Decline inscription ties it to the Daqing documentary.
- **divided-101.glb**: A clear-span highway gantry with paired foundations, lattice truss, catwalk, inspection ladder, lamps and raised lettering. The roadway remains open under the sign.

The `.blend` files include editable geometry and studio render setups. `build_industrial.py` reproducibly builds all three assets and exports them to `../../dist/models/`. `*-preview.png` are inspected Cycles renders; `*-metadata.json` records bounds and mesh counts. Front is glTF +Z, up is +Y, ground is Y=0.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python models/industrial/build_industrial.py
```

## Pumpjack animation

`../../dist/industrial-motion.js` exports `createIndustrialMotion(id, fittedGroup)`. For `city`, it returns an update function taking elapsed seconds. A four-bar circle-intersection solution preserves the pitman linkage length while the crank turns and the walking beam rocks. Named empty nodes in the GLB retain independent pivots: `pump_beam`, `pump_crank_front`, `pump_crank_back`, `pump_pitman_front`, `pump_pitman_back`, `pump_polished_rod`. Parent scene pause and reduced-motion settings control elapsed time.

## Visual reference

Apple's official [Vision Pro design page](https://www.apple.com/apple-vision-pro/) was used to study the wraparound glass, aluminum enclosure, light seal and straps. The resulting model is an original, simplified portfolio sculpture with its own proportions and sensor arrangement.

## Geometry and motion clearance audit

The pump's polished rod stays on the fixed well axis. Its visible shaft ends at local Y=0.8 inside a genuinely hollow wellhead, instead of extending below the display base. Cranks and pitman rods are spaced away from the motor housing and A-frame; shafts and bearings retain intentional mechanical contact. Two runtime bridle ropes remain attached throughout the stroke.

Headset sensors, crown, upper strap anchors and support cradle have been seated onto their corresponding surfaces. The curved visor has no folded front-facing facets. The highway gantry uses separate left/right foundations; its road opening remains clear, with ladder clips and truss saddles added at their actual attachment points.

`audit_motion.mjs` reconstructs the actual exported GLB vertex buffers as Three.js objects, runs 360 phases using the production motion module, and writes `collision-audit.json`. It checks the fixed rod axis and shaft floor, bridle endpoints, crank/base, motor endplate, housing and pitman/frame clearances, and visor facet orientation. These targeted checks exclude designed shaft/bearing and assembled component joints; they are not a general-purpose collision solver.
