# Conversão do aplicativo — entrega de implementação

A direção aprovada é pixel art RPG detalhada, com materiais, iluminação e narrativa
ambiental. A conversão visual de produção está integrada ao aplicativo inteiro.
Isso descreve cobertura de código e arte; homologação física e publicação nativa
continuam separadas, sem presumir compras/anúncios reais validados no simulador.

## Cobertura entregue

| Conteúdo | Integrado |
| --- | ---: |
| Tropas animadas | 15/15 |
| Zumbis e chefes animados | 30/30 |
| Retratos de cartas | 24/24 |
| Retratos do Bestiário | 30/30 |
| Cenários da campanha | 12/12 |
| Variantes de base | 3/3, com 4 danos cada |
| Ícones compartilhados | 26/26 |
| Retratos do rádio | 4/4 |
| Materiais de interface | aço, madeira, latão e pedra |
| Identidade de instalação | ícone, splash, Android adaptativo/monocromático e notificação |

As três bases preservam a progressão existente: caminhonete nos cinco primeiros
mundos, blindada em Tecnologia/Laboratório/Lançamento e módulo no ato espacial.
A Fronteira reutiliza os novos temas por ID e conserva suas tonalidades e mutações.

Home, Deck/detalhes/melhorias, Fases/preparação, combate/tutorial/treino/resultados,
Loja/assinatura/compras/Passe, missões, semanal, Expedição, Oficina, Bestiário,
conquistas, diário e Ajustes usam a nova identidade. Botões, cards, painéis, modais,
HUD, saldos, indicadores e controles compartilham molduras retas, relevos curtos,
texturas discretas e Rubik Black/Medium/Bold já licenciadas no projeto. A marca
Google e as interfaces nativas de login/loja conservam sua apresentação oficial.
Não foi introduzida fonte externa ou filtro sobre a arte cartoon antiga.

## Integração e correções

- O render completo mantém tiros, cura, gelo, eletricidade, escavação, divisão,
  salto, evoluções, personalizações, clima e eventos. Áreas e contornos dos efeitos
  usam formas escalonadas; as partículas de neve são quadradas.
- Âncoras do corpo registram os três passos da caminhada. Posições continuam
  contínuas; nearest atua na amostragem da arte. Fragmentos de outras linhas ficam
  fora do empacotamento. Ataques, cadáveres e espelhamento usam metadados próprios.
- Pontos de tiro, lança-chamas e Tesla são ajustados à nova arte na apresentação,
  sem modificar eventos/snapshots do motor. Paths usam o PathBuilder do Skia.
- Mundo lógico permanece 600 × 900, muro em y=780. O viewport de 1150 inclui
  somente decoração inferior; arrastar cartas abaixo de y=900 continua inválido.
- Títulos longos deixam o saldo em outra linha; a Oficina perdeu o seletor duplicado
  e o brilho antigo; Voltar funciona também em links sem histórico; o Bestiário ganhou uma lista completa, sem duplicar Cosmonauta
  nem omitir Larva. Fonte ampliada considera os tamanhos específicos de cada texto.
- Preservados IDs, saves, regras de anúncios/assinatura, balanceamento e servidor.
  A infraestrutura de comparação permanece nos testes automatizados.

## Fontes, reprodução e memória

Fontes PNG imutáveis em `apps/mobile/assets/pixel16-detailed`; prompts e procedência
em `production/` e `detailed/provenance.json`. Fontes geradas por modelo são guardadas,
não prometidas como regeneráveis de forma idêntica. Recortes/registro/empacotamento
são determinísticos e verificáveis por SHA-256. Não editar saídas manualmente.

```sh
nvm use
npm run art:pixel:detailed
npm run art:pixel:detailed:check
npm run typecheck
npm test
npm run lint
```

São 67 fontes PNG, 166.368.593 bytes. As 45 folhas originais equivalem a cerca de
270 MiB RGBA; as versões de runtime, com células de aproximadamente 128 px, a
67,5 MiB: redução de 75%. O runtime carrega somente cenário/base e unidades da
partida. Esses números descrevem texturas; não são medição de memória total do app.
Fontes grandes usadas para criação e atlas integrais de ícones não são carregados
como texturas de combate. A interface usa os recortes menores.

`modules.ts` contém requires estáticos para Metro. `manifest.json` registra fontes,
hashes, bounds, âncoras, três vistas, oito poses por vista e os estados das bases.
O catálogo gerado fica em `artifacts/pixel16-detailed/catalog.html`, fora do Git.

## Evidências e limites

- Tipos dos três pacotes e lint sem erros; seis avisos de requires nativos
  condicionais preexistentes. Testes do monorepo e relatório final em `QA.md`.
- Checker reproduz dois empacotamentos e verifica 1.080 poses, 12 danos de base,
  retratos, materiais, mascotes, fontes, identidade e catálogo sem alterar originais.
- Catálogo: 45 unidades × 3 vistas × 4 estados, 540 combinações; sem imagens ausentes
  ou overflow em 390/1100 px. Cada base tem quatro estados selecionáveis.
- Teste do render completo cobre todas as unidades, prévias das 24 cartas, danos
  de base, estados, quatro climas, efeitos e imutabilidade do snapshot.
- Simulador iPhone 17/iOS 26.4: telas principais, estados bloqueados/offline,
  treino em Fazenda/Cidade/Colmeia/Lua e resultados. Capturas em
  `artifacts/pixel16-detailed/native/`. Teste não concede recompensas nem altera saves.
- Landing PT/EN/ES em 390/1440 px, imagens e seleção de personagens conferidas;
  prévia privada atualizada em https://zombie-road-official.arthurprasniski.chatgpt.site
  via Sites, commit independente `13277c3f8c3c727f6e868c1538565c89df07ea23`.
  As variáveis de links permanecem no `.env.example` do site.

Não foram executados compras/anúncios reais, homologação física Android/iOS ou
medição sustentada de FPS/memória em aparelho. Novo ícone e splash entram no
próximo build nativo; o Metro sozinho não substitui os recursos de instalação.
Não há publicação nas lojas nesta entrega.

## Conferência no celular

Abrir o development build com Metro e navegar normalmente. Para inspecionar arte
sem recompensas: `zombieroad://combat?mode=training&autoplay=1&artworld=moon`.
`artworld` é exclusivo de desenvolvimento e não altera a fase lógica. Acrescentar
`spawn=cosmonaut,commander` ou outros IDs permite inspecionar inimigos específicos.
A opção dos Ajustes e a rota de teste visual foram removidas em 15/10/2026.
O enquadramento atual mantém toda a decoração inferior visível, com compensação
da altura dos sprites para preservar proporções. A bolsa de sangue substitui a
gota na barra, com preenchimento em pixels e contador separado.
