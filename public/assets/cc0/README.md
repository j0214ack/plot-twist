# CC0 asset provenance

These files are vendored so the playable demo does not depend on a third-party CDN at runtime. They may be used, modified and redistributed under Creative Commons Zero 1.0.

## Kenney — Mini Dungeon 1.6

- Source: https://kenney.nl/assets/mini-dungeon
- Author: Kenney
- License: CC0 1.0 Universal
- Original archive: `kenney_mini-dungeon.zip`
- Vendored files: `character-human.glb`, `character-orc.glb`, `gate.glb`, `floor.glb`, `wall.glb`, `column.glb`, `rocks.glb`, `stones.glb`, and their shared `Textures/colormap.png`
- Upstream license copy: [`kenney-mini-dungeon/LICENSE.txt`](kenney-mini-dungeon/LICENSE.txt)

The renderer scales and positions these models at runtime. For story consistency, it hides the human rig's `arm-left` and `arm-right` nodes; the source model itself is unmodified.

## Quaternius — Key

- Source: https://poly.pizza/m/y3bSVdIjTh
- Author: Quaternius
- License: CC0 1.0 Universal
- Vendored file: `quaternius-key/key.glb`
- Original model identifier: `d5f9c9e8-7c4f-4008-8260-1666db20aac6`

The source GLB is unmodified. The renderer rotates and scales it at runtime to match the baked key entity.
