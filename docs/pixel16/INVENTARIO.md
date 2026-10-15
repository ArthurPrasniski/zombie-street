# Inventário da conversão 16-bit

Gerado por `npm run art:pixel:inventory`. 164 imagens PNG.

A matriz completa em [inventory.json](inventory.json) inclui origem, consumidores diretos,
cópias idênticas da web, SHA-256 e destino de cada asset. Consumidores dinâmicos
devem ser conferidos junto com os geradores; zero referências diretas não significa asset sem uso.

## Cobertura

- identity: 10
- bestiary: 30
- cards: 24
- mascots: 2
- radio: 4
- sprites: 45
- ui: 25
- worlds: 24

## Rotas e render

`apps/mobile/app/_layout.tsx` · `apps/mobile/app/achievements.tsx` · `apps/mobile/app/bestiary.tsx` · `apps/mobile/app/combat.tsx` · `apps/mobile/app/deck.tsx` · `apps/mobile/app/diary.tsx` · `apps/mobile/app/expedition.tsx` · `apps/mobile/app/garage.tsx` · `apps/mobile/app/index.tsx` · `apps/mobile/app/missions.tsx` · `apps/mobile/app/pass.tsx` · `apps/mobile/app/pixel-pilot.tsx` · `apps/mobile/app/play/[...path].tsx` · `apps/mobile/app/prepare.tsx` · `apps/mobile/app/purchases.tsx` · `apps/mobile/app/settings.tsx` · `apps/mobile/app/shop.tsx` · `apps/mobile/app/stages.tsx` · `apps/mobile/app/weekly.tsx`.

O JSON lista também 17 módulos do render; referências dinâmicas exigem revisão desse conjunto. Web disponível nesta coleta: sim.

## Assets

| Asset | Dimensões | Gerador | Referências diretas | Cópias na web | Estado |
| --- | --- | --- | --- | --- | --- |
| android-icon-background.png | 1024×1024 | build.mjs, brand.mjs, lobby.mjs | 0 | 0 | Planejado |
| android-icon-foreground.png | 1024×1024 | build.mjs, brand.mjs, lobby.mjs | 0 | 0 | Planejado |
| android-icon-monochrome.png | 1024×1024 | build.mjs, brand.mjs, lobby.mjs | 0 | 0 | Planejado |
| bestiary/android.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/astronaut.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/bloater.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/brute.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/colossus.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/commander.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/cop.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/cosmonaut.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/digger.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/director.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/frost.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/general.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/grunt.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/hulk.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/larva.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/lunarWorm.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/marsTitan.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/mutant.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/padChief.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/pod.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/queen.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/riot.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/runner.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/shielder.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/spitter.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/splitling.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/splitter.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/walker.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/xeno.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| bestiary/yeti.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/airstrike.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/barricade.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Protótipo simples |
| cards/blackhole.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/chainsaw.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Protótipo simples |
| cards/crossbow.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/cryo.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/dog.png | 256×256 | build.mjs, portraits.mjs | 1 | 1 | Protótipo simples |
| cards/drone.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/firefighter.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/forcefield.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/grenade.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Protótipo simples |
| cards/landmine.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/laser.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/medic.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/medkit.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Protótipo simples |
| cards/molotov.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Protótipo simples |
| cards/orbital.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/sheriff.png | 256×256 | build.mjs, portraits.mjs | 1 | 1 | Protótipo simples |
| cards/shotgun.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/sniper.png | 256×256 | build.mjs, portraits.mjs | 1 | 1 | Protótipo simples |
| cards/soldier.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/tesla.png | 256×256 | build.mjs, portraits.mjs | 1 | 1 | Planejado |
| cards/titan.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| cards/turret.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| favicon.png | 48×48 | build.mjs, brand.mjs, lobby.mjs | 0 | 0 | Planejado |
| google-g.png | 200×204 | build.mjs, brand.mjs, lobby.mjs | 1 | 0 | Planejado |
| icon.png | 1024×1024 | build.mjs, brand.mjs, lobby.mjs | 0 | 1 | Planejado |
| lobby.png | 1080×1185 | build.mjs, brand.mjs, lobby.mjs | 1 | 1 | Planejado |
| logo.png | 641×150 | build.mjs, brand.mjs, lobby.mjs | 1 | 1 | Planejado |
| mascots/truck.png | 512×512 | build.mjs, portraits.mjs | 2 | 1 | Planejado |
| mascots/walker.png | 512×512 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| notification-icon.png | 96×96 | build.mjs, brand.mjs, lobby.mjs | 0 | 0 | Planejado |
| radio/sheriff.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| radio/sniper.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| radio/static.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| radio/vega.png | 256×256 | build.mjs, portraits.mjs | 1 | 0 | Planejado |
| splash-icon.png | 1024×1024 | build.mjs, brand.mjs, lobby.mjs | 0 | 0 | Planejado |
| sprites/android.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/astronaut.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/barricade.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Protótipo simples |
| sprites/bloater.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/brute.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Protótipo simples |
| sprites/chainsaw.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Protótipo simples |
| sprites/colossus.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/commander.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/cop.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/cosmonaut.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/crossbow.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/digger.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/director.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/dog.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Protótipo simples |
| sprites/drone.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/firefighter.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/frost.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/general.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/grunt.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/hulk.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/larva.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/laser.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/lunarWorm.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/marsTitan.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/medic.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/mutant.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/padChief.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/pod.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/queen.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/riot.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/runner.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Protótipo simples |
| sprites/sheriff.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Protótipo simples |
| sprites/shielder.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/shotgun.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/sniper.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Piloto detalhado |
| sprites/soldier.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/spitter.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/splitling.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/splitter.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/tesla.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/titan.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/turret.png | 4000×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/walker.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Piloto detalhado |
| sprites/xeno.png | 3360×480 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| sprites/yeti.png | 6048×864 | build.mjs, units.mjs, clash.mjs | 1 | 0 | Planejado |
| ui/back.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/bag.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/blood.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/book.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/bullet.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/check.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/coin.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/crown.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/evo.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/gear.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/gem.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/hourglass.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/lock.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/next.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/pause.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/play.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/radio.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/shield.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/skull.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/star.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/starEmpty.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/trophy.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/tv.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/up.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| ui/wrench.png | 96×96 | build.mjs, icons.mjs | 1 | 0 | Planejado |
| worlds/city-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/city.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 1 | Planejado |
| worlds/desert-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/desert.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 0 | Planejado |
| worlds/farm-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Piloto detalhado |
| worlds/farm.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 1 | Piloto detalhado |
| worlds/hive-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/hive.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 0 | Planejado |
| worlds/lab-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/lab.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 1 | Planejado |
| worlds/launch-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/launch.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 0 | Planejado |
| worlds/mars-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/mars.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 1 | Planejado |
| worlds/moon-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/moon.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 1 | Planejado |
| worlds/snow-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/snow.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 0 | Planejado |
| worlds/station-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/station.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 0 | Planejado |
| worlds/swamp-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/swamp.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 0 | Planejado |
| worlds/tech-base.png | 4800×270 | build.mjs, arena.mjs, base.mjs | 1 | 0 | Planejado |
| worlds/tech.png | 1200×1800 | build.mjs, arena.mjs, base.mjs | 2 | 0 | Planejado |
