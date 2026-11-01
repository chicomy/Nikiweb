# Independent sports landmarks

Three separate Blender scenes and GLB assets give basketball, golf and football their own locations and activity content. All models use glTF Y up, front +Z and ground at Y=0; each base is centered around X/Z=0.

| Asset | Exported width × depth × height | Triangles | Meshes |
| --- | --- | --- | --- |
| `basketball-court` | 6.700 × 6.558 × 3.110 | 9,220 | 10 |
| `golf-green` | 5.700 × 8.308 × 3.110 | 6,476 | 13 |
| `football-pitch` | 8.200 × 5.508 × 1.593 | 9,292 | 12 |

`build_sports.py` rebuilds all three editable `.blend` files, metadata, studio previews and `../../dist/models/*.glb` exports. It uses the local geometry builder from `../palo-alto/build_landmarks.py`. Each scene has its own compact base. The basketball scene preserves one half-court and one rear hoop, glass backboard, woven net, sideline bench and lights. Golf contains the putting green, bunker, cup, flag, bag, clubs and bench. Football is a separate striped pitch with framed nets, corner flags, three static players and a stitched ball.

`../../dist/sports-motion.js` exports `createSportsMotion(parent, kind = 'basketball')`. Valid kinds are `basketball` and `golf`; unsupported kinds return null. The parent must share the associated model's local coordinates. Basketball creates only its three articulated players and two basketballs. Golf creates only its golfer, mentor, moving ball and putter. Both return `{ update, state }`; the scene clock supplies time and controls pause/reduced motion. Football participants are baked into the static GLB and require no sports-motion instance.

The animation keeps the original survey coordinates internally. Its ensemble translation is `(2.75, 0, 1.125)` for basketball and `(-3.15, 0, 0)` for golf; these match `original_to_gltf_offset` in the exported metadata. No external position compensation is needed when each ensemble and model have the same parent.

Foot placement follows posed shoe geometry, including knee bend and body lean. Hand positions drive the dribbled ball and putter grip. The putter head remains horizontal while its shaft follows the golfer's hands. Golf participants clear the bunker and bench. The basketball bench remains inside its base and outside the sideline. The half-court's original Blender Y range is −1.85 to 3.825, with front boundary −1.60; the original shot target and rear hoop position remain unchanged.

`audit-motion.mjs` runs locally with vendored Three.js and no browser. It instantiates both kinds separately and verifies that each creates only its own athletes and equipment. It samples 56 seconds at 60 Hz (3,361 frames), checks feet against each surface, player and ball boundaries, balls against heads, rim, net, backboard, post and base, and putter clearance from turf, shoes, torso and head. Exported GLB bench vertices and transforms are used to check court/base boundaries and the mentor's whole body and shoes against the bench. All measured clearances are positive; the minimum mentor/bench whole-body gap is 0.23377 model units. Ball/putter contact and entry into the cup are intentional. `clearance-audit.json` stores the numerical results.

Build from the project directory:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/sports/build_sports.py
node models/sports/audit-motion.mjs
```

To rebuild one scene, append `-- basketball-court`, `-- golf-green` or `-- football-pitch` to the Blender command. The obsolete combined Sports Park assets are archived outside this project in `../archive/niki-city-before-split-sports/`.
