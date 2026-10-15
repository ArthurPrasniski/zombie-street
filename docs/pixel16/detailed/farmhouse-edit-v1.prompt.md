# Fazenda — casa atrás da caminhonete

Ferramenta: `image_gen` integrada (skill `imagegen`).
Entrada preservada: `docs/pixel16/concepts/farm-wide-clearing-v1.png`.
Saída: `apps/mobile/assets/pixel16-detailed/farm.png`.
Casa de fazenda americana na faixa inferior, como fundo da caminhonete separada.
Linha da defesa em y=780; manter construção e telhado abaixo da área de combate.

## Refinamento de enquadramento

A primeira geração colocou o telhado alto demais; edição para reduzir e baixar a casa.

```text
Use case: precise-object-edit. Make ONLY ONE targeted correction to this image: make the farmhouse SMALLER and LOWER. Current image is 1024x1536 and its roof peak is around y=1220; this intrudes into the game's battlefield. Scale the entire farmhouse to 70% of its current size, keep it centered horizontally, and move it DOWN so its highest roof/chimney pixel is at y=1360 or lower (about 89% of image height). Restore matching bare dirt/short grass wherever the old larger roof used to occupy y=1220 through y=1359. There must be NO house roof, chimney, wall or porch above y=1360. It is intentional and REQUIRED that much of the lower house continues outside the bottom edge: only the gabled roof and a small amount of the upper facade/porch will be visible in the lowest 176 pixels. Do NOT try to fit the whole house into the canvas. Preserve the exact same American white clapboard farmhouse design, red-brown shingle roof, warm window lights, perspective and detailed pixel art. Preserve all the rest of the scene and exact canvas 1024x1536, including the north cornfield and clear side lanes. Do not draw the y=1360 guide, any text, truck, sandbag wall or actors. The house must sit behind a separate truck layer below the defense line.
```

## Prompt enviado

### Versão escolhida — extensão inferior

As tentativas no canvas original sobrepunham casa e caminhonete. A versão escolhida
estende somente a área visual inferior; o mundo jogável continua em 600×900.

```text
Use case: precise-object-edit / downward outpainting. Input is the clean Zombie Road farm arena WITHOUT a house. EXTEND THE CANVAS DOWNWARD ONLY: new portrait aspect ratio 4:7, ideally 1024x1792 instead of 1024x1536. Preserve the original arena in the TOP 1024x1536 region as closely as possible: shallow cornfield top, broad dirt combat clearing, free side lanes and all original lighting/texture. The bottom of the original region is y=1536. In the NEW ADDED BOTTOM REGION y=1536..1792, add a charming small AMERICAN FARMHOUSE centered below the future pickup truck, separated from that truck by a short driveway. This is crucial: EVERY part of the house including roof and chimney starts BELOW y=1540; no roof enters the original battle arena. Show a compact one-story white weathered clapboard farmhouse/ranch home, red-brown shingle gable roof, covered wooden porch with posts, front door and warm lit windows facing UP/north toward the arena. House about 45%-50% of canvas width, front porch near the bottom edge, scale coherent with the farm. Detailed hand-crafted pixel art, same overhead orthographic RPG camera and golden evening light. Low shrubs frame only the bottom corners. Leave the original lower clearing around x=35%-65%, y=1350..1535 unobstructed for a SEPARATE defensive pickup and sandbag layer that will be drawn by the game. The separate truck will be IN FRONT of the house, above it on screen; there must be actual spacing between them, not a truck drawn on a roof. DO NOT DRAW any truck, sandbags, actors, UI, labels or text. Deliver a visibly TALLER 4:7 image, preserving original gameplay area and adding ONLY a bottom homestead backdrop. Do not compress the arena or move the house up to fit the old canvas.
```

### Estudo inicial no canvas original

### Ajuste final da casa na faixa estendida

```text
Precise layout correction ONLY. Preserve the exact 948x1659 tall canvas, the cornfield, dirt arena, side ground textures and all lighting. The farmhouse is currently too large and too high. SCALE THE ENTIRE HOUSE INCLUDING ROOF, CHIMNEY, PORCH AND STEPS TO 65% OF ITS CURRENT SIZE. Move this smaller house DOWN, centered at x=474. Its HIGHEST roof/chimney pixel must be at y=1450 or lower; its front porch steps should finish at y=1650, just 9 pixels before the bottom edge. The full smaller house will be about 320 pixels wide and about 200 pixels tall. Keep its exact American white wooden farmhouse design, gabled red roof, warm windows and porch. Restore matching bare dirt at the OLD house location y=1240..1449 so the area above the small house becomes a clear driveway. This empty driveway is REQUIRED for a separate pickup layer; no house pixel may be above y=1450. All original corn and upper arena stay unchanged. Keep the FULL small house visible near the bottom; do NOT enlarge it to fill the image. No truck, sandbags, actors, UI or text.
```

### Prompt do estudo inicial

```text
Use case: precise-object-edit. Edit target: the attached detailed pixel-art Zombie Road farm arena. Add ONE classic American farmhouse as the HOME BEHIND THE DEFENSIVE PICKUP, in the bottom background only. Keep the exact 1024x1536 portrait canvas, camera, detailed pixel-art finish, warm golden light, cornfield at the top, and the broad unobstructed dirt arena. Important game geometry: a separate sandbag/truck layer will be drawn over this image at y=87%-100%. ALL house roof, chimney, porch and walls must be entirely within the LOWEST 12 percent of the image (y=88%-100%); no part of the house may rise above that boundary into the battle arena. Center the house at bottom x=50%, with approximately 48%-54% of total image width. The bottom of the house intentionally continues beyond the bottom edge of the canvas; show its charming gabled roof, upper white wooden clapboard facade, warm windows and the upper part of a covered wooden front porch, cropped naturally by the bottom edge. This is an understated one-story American farmhouse/ranch homestead with a red-brown shingle gable roof, white weathered wood siding and porch posts, facing NORTH into the clearing. It must read as a real farmhouse of the same world and scale as the art, not a miniature toy or a giant mansion. Place it behind the future truck visually: house is background, separate pickup will overlap in front. Reconstruct the low shrubs around its side foundations only in the bottom band. Preserve ALL pixels in the top 85 percent as closely as possible, especially the open side lanes and cornfield. Do not reintroduce side trees, crates, fences or any raised obstacles in the playable clearing. Do NOT draw any truck, sandbags, characters, zombies, animals, UI, lettering or labels; those are separate layers. The house is purely visual shelter behind the defense line, never an obstacle for units.
```
