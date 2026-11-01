# Community miniatures

Three original detailed Blender assets for Niki's World, modeled in Blender 5.2.2 with geometry and color materials. They retain rounded miniature proportions and share an 8 × 7 base.

- **civic-hall**: fluted columns with layered bases and capitals, dentil cornice, ribbed dome, arched glazed portal, steps and railings, testimony lectern/microphone, speaker and seated visitor.
- **care-cottage**: individual terracotta tiles, masonry chimney, heart-window dormer, clapboard walls, porch, greenhouse frame, flower boxes, shared bench and two residents.
- **learning-garden**: layered open-book roof and bookmark, open reading shelter, individual shelf books, teacher and children, reading table, alphabet blocks and slide with ladder/rails.

Each model has a `.blend` source with studio camera/lights, a `*-preview.png`, and `*-metadata.json`. Web exports are in `dist/models/`. Exported models contain only asset meshes; studio objects are excluded. Front façades face Blender −Y / glTF +Z, with glTF Y up and base at Y=0. Static geometry is merged by material to 16–21 meshes per asset.

## Rebuild

From the `niki-city` project folder:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python models/community/build_community.py
```

`mesh_helpers.py` is local to this folder, so rebuilding does not depend on the Stanford model source. Blender renders use Cycles. No remote image textures, downloaded reference files or private source documents are needed.
