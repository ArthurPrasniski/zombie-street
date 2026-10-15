# Fazenda — laterais livres para circulação

Ferramenta: `image_gen` integrada (skill `imagegen`), edição do cenário existente.
Entrada preservada: `docs/pixel16/concepts/farm-cornfield-dense-v1.png`.
Saída: `apps/mobile/assets/pixel16-detailed/farm.png`.
Escolha: ampliar a clareira e reduzir a decoração alta nas laterais, preservando as ondas.
Referências físicas: FIELD x=30–570; spawn x=60–540; tropas x=40–560; defesa y=780.
Considerar também a largura dos sprites; pés sobre terra não bastam se a copa invade o corpo.

## Prompt enviado

```text
Use case: precise-object-edit. Edit the attached Zombie Road farm arena to FIX SIDE OBSTACLES conflicting with gameplay. Preserve the approved detailed pixel art, exact 1024x1536 portrait canvas, warm golden lighting, color palette, north CORNFIELD with multiple exits, and open ground for the separate defensive base. Make a substantially WIDER dirt clearing; this is important, not a subtle cleanup. The playable band from y=15% to y=88% of image height must be walkable flat terrain essentially edge-to-edge. Remove all tall side trees AND their canopies, stacked crates, wheelbarrow, barrels, raised water tank/tower, tires, timber, brick walls, buildings, lamps/posts, and tall side corn rows throughout this middle band. Reconstruct coherent worn dirt under removed objects. Dirt should span approximately x=3% to x=97%; the outermost 3% on either side may have FLAT short grass, tiny weeds or small stones only, no solid obstacles, large bushes, trunks or overhanging canopy. Do not merely shrink the existing props while leaving them in the combat area. Concentrate rich raised props and foliage ONLY in the bottommost 10% of the image (below the defense line), and preserve the top shallow cornfield so enemies still come from the corn. Keep the clearing visually interesting with subtle trampled earth, wheel ruts, small patches of short grass, soil color variations and a few tiny pebbles, all visibly WALKABLE, no grids. Keep the lower central area empty to overlay the truck/base. No zombies, characters, animals, truck, base, UI, labels or text. The goal is a broad farm battle arena where sprites at x=5% and x=95% walk on clear ground instead of appearing on top of trees or crates. Same camera, same art quality; only redistribute/remove the environmental detail to respect this walkable area.
```
