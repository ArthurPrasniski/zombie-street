# Fazenda — entrada pelo milharal

Ferramenta: `image_gen` integrada (skill `imagegen`), edição do cenário existente.
Entrada preservada: `docs/pixel16/concepts/farm-clean-barn-v1.png`.
Saída: `apps/mobile/assets/pixel16-detailed/farm.png`.
Solicitação: substituir o celeiro no topo por milharal para os zumbis emergirem da plantação.
Os spawns existentes cobrem x=60–540 e y=-40, no mundo 600×900.

## Prompt enviado

```text
Use case: precise-object-edit. Edit ONLY the NORTH/TOP portion of this existing approved Zombie Road game background. Replace the entire red barn, ALL its roofs, silo, windmill and barn-associated north-edge structures with a CORNFIELD from which zombies can emerge. Keep the exact portrait 1024x1536 canvas, same detailed pixel-art style, earthy colors, golden late-afternoon lighting and overhead orthographic RPG camera. Cornfield design: tall dense green and golden corn extending beyond the TOP edge and spanning the whole north width, with an irregular front edge and several narrow broken openings between stalks across the middle 80 percent of the width. The actual zombie spawn positions are spread across x=10% through x=90% at the top, so do NOT funnel everything into a single central doorway. Keep the main solid corn band shallow: approximately top 10% of image height; it should transition through scattered stalks and trampled soil to OPEN combat ground by y=15% of image height. No barn, roof, building, wall, silo or raised platform anywhere in the upper spawn area. The effect must read as creatures coming out of crops into the arena, not walking over a building. Preserve ALL the rest of the image below the top 22 percent as closely as possible: identical ground, side trees/crops, rustic edge equipment, lamps, bottom gate, dirt clearing, open lower ground for the separate base. No characters, zombies, animals, base, truck, UI, text or grid. Keep this a clean environment layer, and do not paint any sprites or health bars.
```
