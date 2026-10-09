# GDD — Zombie Road (MVP, versão com cartas)

Status: aprovado; implementado até C29, com C30 a C34 (conta, loja, passe e propagandas)
prontas no app e no servidor, faltando só as contas externas (docs/BACKEND.md). Substitui a versão idle
(heróis fixos que atacam sozinhos). Os números são ponto de partida; ajuste
em src/game/data.

## 1. Visão

Defense de cartas em modo retrato, no estilo Clash Royale. O jogador
defende uma base (a caminhonete) embaixo contra ondas de zumbis que descem do
topo. Durante a partida, ele joga cartas de heróis (tropas) e de armas
especiais, pagas com sangue que se acumula sozinho. Entre as fases, gasta o
dinheiro ganho subindo o nível das cartas e monta o deck.

## 2. Loop principal

1. Na tela Deck, o jogador escolhe 8 cartas.
2. Na fase, a mão tem 4 cartas; a 5ª aparece como "próxima".
3. O sangue enche sozinho. Arrastar uma carta para o campo a joga:
   tropas surgem onde foram soltas; armas especiais agem no ponto escolhido.
4. A carta jogada vai para o fim da fila e a "próxima" entra na mão.
5. Tropas lutam sozinhas e morrem de vez quando a vida acaba.
6. Cada fase tem 5 ondas; a onda 5 traz o chefe.
7. Vitória: vencer a onda 5 com a base de pé. Libera a próxima fase.
8. Derrota: a base cai. O dinheiro dos zumbis mortos fica.
9. Dinheiro sobe o nível das cartas (seção 10).

## 3. Campo de batalha

- Mundo lógico de 600 x 900, em pé (o motor nunca usa pixels de tela). Visto
  de cima, inclinado, como no Clash Royale. Campo aberto e contínuo: sem rio
  nem pontes; a estrada de terra no meio é só cenário.
- As unidades andam em x de 30 a 570 e y de -60 a 780.
- Topo: cemitério. Zumbis nascem em y = -40 (fora da tela), com x sorteado
  entre 60 e 540, e descem em linha reta.
- Base (muro de sacos de areia na largura toda e a caminhonete com a
  metralhadora atrás) ocupa o fundo. A frente do muro é y = 780; a boca da
  metralhadora fica em (300, 800).
- Zona de mobilização (metade de baixo): tropas só podem ser soltas em x de
  40 a 560 e y de 470 a 760. Armas especiais podem mirar qualquer ponto acima
  da base (y até 780).
- Distâncias e alcances são euclidianos (x e y), a não ser quando indicado.
- Cada unidade guarda a direção para onde olha (dirX, dirY): descendo aparece
  de frente, subindo aparece de costas e andando de lado aparece de perfil.
  Sem alvo, as tropas olham para o topo.

## 4. Base

| Vida | Arma no teto | Dano | Intervalo (s) | Alcance |
| ---- | ------------ | ---- | ------------- | ------- |
| 1000 | Metralhadora | 8    | 0.7           | 300     |

- A metralhadora mira o zumbi mais próximo dentro do alcance.
- Zumbi que chega à frente da base (y >= 780) para e ataca a base.
- A vida da base não se recupera durante a fase (o Kit médico não cura a base).

## 5. Sangue

O "custo" das cartas é sangue (combina com o tema). Nas versões antigas do GDD
ele se chamava energia; no código é `blood` (BLOOD, world.blood).

- Começa em 1, máximo 10.
- Recarga: +1 a cada 3,5 s. Na onda do chefe, a recarga dobra (+1 a cada 1,75 s).
- A recarga continua entre as ondas e congela com o jogo pausado.
- O sangue aparece como barra vermelha de 10 segmentos, com uma gota e o valor
  inteiro ao lado. Nas cartas, o custo vem numa gota de sangue.

## 6. Cartas

### 6.1 Tropas (heróis)

| id        | Nome      | Arma       | Custo | Vida | Dano | Intervalo (s) | Alcance | Velocidade | Tipo          |
| --------- | --------- | ---------- | ----- | ---- | ---- | ------------- | ------- | ---------- | ------------- |
| sniper    | Mira      | Rifle      | 4     | 80   | 34   | 1.8           | 600     | 0          | à distância   |
| sheriff   | Xerife    | Revólver   | 3     | 120  | 12   | 0.8           | 320     | 0          | à distância   |
| shotgun   | Bruno     | Escopeta   | 3     | 160  | 18   | 1.2           | 160     | 0          | à distância*  |
| chainsaw  | Serra     | Motosserra | 4     | 220  | 26   | 1.0           | 45      | 60         | corpo a corpo |
| dog       | Rex       | Mordida    | 2     | 90   | 14   | 0.7           | 30      | 110        | corpo a corpo |
| barricade | Barricada | —          | 3     | 600  | 0    | —             | —       | 0          | construção    |
| soldier   | Soldado   | Metralhadora | 4   | 140  | 6    | 0.22          | 280     | 0          | à distância   |
| firefighter | Bombeiro | Lança-chamas | 4  | 200  | 7    | 0.3           | 120     | 0          | à distância** |
| medic     | Médica    | Maleta     | 3     | 110  | cura 14 | 1.0        | 160     | 0          | suporte       |
| crossbow  | Lara      | Besta      | 4     | 90   | 45   | 2.0           | 520     | 0          | à distância***|
| turret    | Torreta   | Metralhadora automática | 4 | 300 | 9 | 0.5      | 280     | 0          | construção que atira (25 s) |

\* Escopeta: acerta o alvo e até mais 2 zumbis a até 60 do alvo.
\*\* Lança-chamas: acerta o alvo e até mais 5 zumbis a até 70 do alvo.
\*\*\* Besta: o virote acerta até 4 zumbis numa faixa de 26 ao longo da linha
do tiro, até o alcance.

- Suporte (Médica): não ataca; a cada 1 s cura 14 (x nível) as tropas feridas
  a até 160, ela inclusive. Se ninguém precisa, espera.
- Torreta: atira como uma tropa à distância, é construção (os chefes param
  nela) e some sozinha depois de 25 s, sem contar como tropa caída.

- À distância: fica onde foi solta e atira no zumbi mais próximo dentro do
  alcance.
- Corpo a corpo: anda até o zumbi mais próximo a até 350 de distância e
  ataca quando chega no alcance. Sem zumbi a 350, fica parada.
- As tropas que andam não saem da área das tropas: abaixo da faixa do topo da
  arena (só avançam até y = 330, uns 140 à frente da linha de mobilização), acima do muro e nas
  laterais da zona de mobilização. Zumbis que elas não alcançam de dentro da
  área (ainda no alto da arena) não viram alvo; na borda, a tropa desliza ao
  longo dela até alcançar o zumbi.
- Construção: não ataca; os zumbis param e batem nela.
- Tropa nova leva 0,5 s para entrar em ação (animação de chegada).
- Ataques são instantâneos. Visual: rastro de tiro de 80 ms nas armas de fogo.

### 6.2 Armas especiais

| id        | Nome         | Custo | Efeito                                                            |
| --------- | ------------ | ----- | ----------------------------------------------------------------- |
| grenade   | Granada      | 2     | 70 de dano em todos os zumbis a até 110 do ponto                  |
| medkit    | Kit médico   | 2     | Cura 50% da vida máxima das tropas a até 150 do ponto             |
| molotov   | Molotov      | 3     | Fogo por 4 s, raio 90: 25 de dano por segundo a quem estiver nele |
| airstrike | Ataque aéreo | 6     | Depois de 1,5 s, 300 de dano a até 160 do ponto                   |
| landmine  | Mina         | 2     | Fica no chão; quando um zumbi chega a 35, explode: 120 a até 90   |

- Ao arrastar uma arma especial, o campo mostra o raio de efeito.
- O dano das armas sobe com o nível da carta (seção 10), não com a fase.

### 6.3 Coleção e deck

- 16 cartas. Deck inicial (8): Mira, Xerife, Serra, Rex, Barricada,
  Granada, Kit médico, Molotov.
- Desbloqueios (ao vencer a fase global): Bruno 3 (1-3), Ataque aéreo 6 (1-6),
  Soldado 8 (1-8), Mina 12 (2-2), Bombeiro 16 (2-6), Médica 22 (3-2),
  Lara 28 (3-8), Torreta 34 (4-4).
- O deck sempre tem 8 cartas distintas. A ordem de compra no início da fase é
  embaralhada pelo RNG com semente.
- No máximo 12 tropas em campo. Com o campo cheio, as cartas de tropa ficam
  apagadas (aviso "Campo cheio") e só armas especiais entram. Sem esse limite,
  a Sobrevivência viraria uma bola de neve de tropas.

## 7. Zumbis

| id     | Nome        | Vida | Velocidade (u/s) | Dano | Intervalo (s) | Recompensa | Alvo                  |
| ------ | ----------- | ---- | ---------------- | ---- | ------------- | ---------- | --------------------- |
| walker | Andarilho   | 40   | 35               | 8    | 1.2           | 5          | tropas e base         |
| runner | Corredor    | 24   | 80               | 6    | 0.8           | 6          | tropas e base         |
| brute  | Brutamontes | 650  | 20               | 30   | 2.0           | 120        | só construções e base |
| cop    | Policial    | 60   | 30               | 9    | 1.2           | 8          | tropas e base (armadura 3) |
| riot   | Blindadão   | 900  | 18               | 34   | 2.0           | 160        | chefe, armadura 10    |
| bloater | Inchado    | 90   | 26               | 8    | 1.3           | 9          | explode ao morrer: 40 a até 80 |
| hulk   | Monstro do Pântano | 1100 | 18          | 36   | 2.0           | 180        | chefe, explode: 120 a até 140 |
| grunt  | Recruta     | 85   | 40               | 11   | 1.1           | 9          | tropas e base (armadura 2) |
| general | General    | 1200 | 20               | 40   | 1.8           | 200        | chefe, armadura 6     |
| frost  | Congelado   | 75   | 32               | 8    | 1.2           | 9          | golpe congela 2,5 s   |
| yeti   | Abominável  | 1400 | 22               | 42   | 2.0           | 220        | chefe, golpe congela 3 s |

- O zumbi desce. Se houver uma tropa (ou construção) a até 120 dele, vai até
  ela e ataca quando estiver a até 40. Senão, segue reto até a base.
- Chefes (Brutamontes, Blindadão, Monstro do Pântano, General, Abominável):
  ignoram tropas (só param em construções e na base) e são desenhados 1,8x
  maiores.
- Armadura: desconta esse tanto de cada golpe direto (mínimo 1). O fogo
  contínuo do molotov passa direto.
- Tropa congelada ataca 1,6x mais devagar e anda a 60% enquanto dura.

## 7.1 Mundos

| # | Mundo            | Fases | Zumbi novo | Chefe              | Cenário                                  |
| - | ---------------- | ----- | ---------- | ------------------ | ---------------------------------------- |
| 1 | Fazenda          | 1-10  | —          | Brutamontes        | cemitério, campo de capim, estrada de terra |
| 2 | Cidade em ruínas | 11-20 | Policial   | Blindadão          | rua de asfalto, carros batidos, telhados |
| 3 | Pântano          | 21-30 | Inchado    | Monstro do Pântano | lama, poças, passarela de tábuas          |
| 4 | Base no deserto  | 31-40 | Recruta    | General            | areia, tanque, contêineres, cerca         |
| 5 | Nevasca          | 41-50 | Congelado  | Abominável         | neve, pinheiros, lago congelado, cabana   |

- Cada mundo tem 10 fases e é liberado ao vencer a última fase do anterior.
- A fase aparece como "mundo-fase" (ex.: 2-3 = fase global 13).
- A base (muro e caminhonete) é a mesma, com o chão do pátio de cada mundo.

## 8. Fases e ondas

- 50 fases, geradas por função em src/game/data/stages.ts, com sobrescrita
  manual possível.
- s = fase global (1 a 50); w = mundo (0 a 4); n = onda (1 a 5). A quantidade
  cresce pela fase global, sem recomeçar a cada mundo.
- Ondas 1 a 4: walkers = 5 + n + floor(s/3); runners = floor((n + floor(s/3)) / 2);
  zumbi do mundo (a partir do mundo 2) = floor((n + 2w) / 2).
- Onda 5: o chefe do mundo (entra primeiro) + walkers = 4 + floor(s/3) e
  w + 1 zumbis do mundo.
- Intervalo entre spawns: 0,9 s; cada tipo extra espalhado de forma uniforme.
- Pausa de 3 s entre ondas, com "Onda n/5" no centro. As tropas continuam em
  campo de uma onda para a outra.
- Escalonamento dos zumbis pela fase global: vida x (1 + 0.16·(s-1)^1.08),
  dano x (1 + 0.04·(s-1)), recompensa x (1 + 0.08·(s-1)) (arredondada para
  baixo). Fase 10 ~2,7x de vida, fase 30 ~7x, fase 50 ~11,7x.
- Simulação com o jogador simples e o deck inicial (todas as cartas no mesmo
  nível; sangue começando em 1 e +1 a cada 3,5 s): fases 1 a 8 no nível 1, 11 no
  3, 15 no 9, 20 no 11, 30 no 16, 40 no 24, 50 no 27. As cartas novas, a Oficina e
  as evoluções dão folga.

## 9. Fim da partida e recompensas

- Vitória: dinheiro dos zumbis mortos + bônus de 50 x s. Modal "Fase s
  vencida!" com o total, botões "Sair", "Repetir" e "Próxima fase".
- Derrota (base em 0): modal "A base caiu!" com o dinheiro ganho, botões
  "Sair" e "Repetir".
- Sair pelo "< Voltar" no meio da fase pede confirmação e conta como
  derrota (o dinheiro já ganho fica).

## 10. Níveis das cartas

- Toda carta começa no nível 1; máximo 30.
- Custo para subir do nível L para L+1: round(custoBase x 1.2^(L-1)).
  custoBase: 30 para tropas, 25 para armas especiais.
- Tropas: vida e dano x 1.10^(L-1). Armas especiais: dano e cura x 1.10^(L-1).
  O custo em sangue não muda com o nível.
- O nível vale a partir da próxima partida (não há upgrade no meio da fase).

## 11. Economia

- Duas moedas: sangue (só dentro da partida) e dinheiro (salvo).
- Dinheiro: entra por zumbis mortos e bônus de vitória; sai em níveis de
  cartas. Exibir abreviado: 999, 1.2K, 3.4M, 5.6B.

## 12. Telas

Sem abas: tudo parte da Home. Telas de menu têm voltar (botão redondo),
título e dinheiro no topo.

Estilo "asfalto e perigo" (paleta própria): fundo grafite, cartões grandes em
cores chapadas (laranja de pôr do sol, verde-petróleo, azul-aço, vinho),
rótulos pequenos em caixa alta e verde-limão tóxico, sangue em vermelho. O
nome do app é Zombie Road: o logo tem "ZOMBIE" em verde-limão, "ROAD" em
branco e uma faixa de asfalto com a linha tracejada amarela. O ícone e o
splash mostram o zumbi comum de frente, grande, na estrada ao pôr do sol.

Acabamento "Clash 2D": títulos, números e botões em Lilita One com contorno
grosso e sombra; textos corridos em Rubik. Botões, cartões e painéis são
"gordinhos": contorno escuro, espessura embaixo (afunda ao tocar) e faixa de
brilho em cima. Cartas com moldura dourada, gota de custo no canto e faixa
com o nome. Personagens com cabeça grande, volume em degradê, luz de borda e
contorno escuro em volta da silhueta inteira; 8 quadros por animação, com
antecipação e esticar/achatar. Arenas com chão quadriculado em dois tons.
Tudo gerado por código.

### Home

- Topo: cena da estrada no pôr do sol de ponta a ponta (atrás do relógio),
  com os heróis de frente e a horda chegando ao fundo (arte gerada por
  código). Por cima do céu: "Km n/10" (fases vencidas), dinheiro e o logo.
  Embaixo, a cena some num degradê na cor de fundo, e a rota começa dentro
  dele.
- "Rota da estrada": as 10 fases como paradas numa estrada (vencidas com
  check, a próxima com um pino amarelo) e a próxima parada por escrito.
- Botão "Jogar" largo, amarelo com faixas de perigo, com a fase ao lado:
  abre o Combate direto na primeira fase não vencida.
- Atalhos lado a lado: Deck (cartas em leque e quantas podem melhorar) e Fases
  (abre a grade).
- Embaixo: o cartão largo da Sobrevivência (recorde, ou a fase que libera) e os
  atalhos Oficina, Bestiário e Conquistas, com avisos de peça para melhorar e
  de prêmio para resgatar. Engrenagem dos Ajustes no topo (seção 17).

### Fases

- Topo: faixa do mundo com o topo do cenário, "Mundo n", o nome, as fases
  vencidas do mundo e setas para trocar de mundo. Mundo bloqueado: escurecido,
  com "Vença a fase n-10 para liberar". Abre no mundo da próxima fase.
- Grade de 2 colunas x 5 linhas com as 10 fases do mundo (números locais):
  vencidas em verde com check, nova em laranja, atual com borda verde-limão,
  bloqueadas apagadas com cadeado; a 10 tem a caveira do chefe. Tocar numa
  fase liberada abre o Combate.

### Deck

- Topo: os 8 espaços do deck (4 x 2), com o contador "n/8". Abaixo: a coleção
  (cartas fora do deck e bloqueadas, estas com a fase que as libera).
- Tocar numa carta a abre no lugar, como no Clash Royale: ela cresce e mostra
  um balão com as ações logo abaixo. Cartas do deck: "Remover" e "Melhorar".
  Cartas da coleção: "Adicionar" e "Melhorar" (com o deck cheio, Adicionar
  fica desativado e o balão avisa). Bloqueadas: só a fase que as libera.
  Tocar na carta aberta ou fora dela fecha.
- "Remover" devolve a carta à coleção e deixa o espaço vazio; "Adicionar" põe a
  carta da coleção no espaço vazio. Tocar num espaço vazio com uma carta da
  coleção aberta também a coloca ali.
- "Melhorar" abre um modal com o nível atual › próximo, cada atributo antes ›
  depois com o ganho (+n), o que não muda marcado como "igual", e o custo em
  dinheiro (com quanto falta, se não der). Confirmar sobe o nível.
- Com o deck incompleto não dá para jogar: "Jogar" (Home) e as fases levam
  para o Deck, e o deck mostra o aviso em vermelho.

### Combate

- A cena mostra o campo inteiro (600 x 900) na largura da tela; em telas
  baixas, encolhe para a faixa de baixo caber.
- HUD sobre o topo da cena: "< Voltar" e pausa à esquerda; "Fase s · Onda
  n/5" com barra de progresso ao lado. A vida da base é uma barra no pátio,
  embaixo da caminhonete.
- Faixa de baixo: as 4 cartas da mão (arte, custo e nome), a "próxima" menor
  ao lado e a barra de sangue.
- Carta sem sangue suficiente fica escurecida e não pode ser arrastada.
- Ao arrastar: tropas mostram uma prévia translúcida e a zona de mobilização
  acende; armas especiais mostram o raio. Soltar fora da zona cancela.

### Modais e avisos

- Fase vencida, Base caiu e confirmação de saída (seção 9).

## 13. Feedback visual e sonoro

- Números de dano flutuando (sobem e somem em 0,6 s); flash branco de 60 ms no
  zumbi atingido; corpos caindo (já existe).
- Tremor de tela quando o chefe entra e no Ataque aéreo.
- Efeitos: explosão da granada, fogo do molotov, cura verde do kit, avião e
  explosão grande do ataque aéreo, fumaça ao mobilizar tropa.
- Sons: tiros por arma, motosserra, latido, explosões, fogo, morte de zumbi,
  base atingida, vitória e derrota. Vibração na explosão e na base atingida.

## 14. Metas do MVP

- 60 fps num Android intermediário com 30 zumbis e 10 tropas em campo.
- A fase 1 é vencível com o deck inicial no nível 1 jogando de forma simples;
  a fase 10 exige cartas melhoradas.
- Nenhum crash ao minimizar e reabrir; minimizar pausa a partida.

## 15. Fora do MVP

- Ganhos offline (o jogo deixou de ser idle).
- Raridade de cartas, baús, gemas, loja, multiplayer, ranking.

## 16. Ordem de implementação

| Etapa | Entrega |
| ----- | ------- |
| C1 | Motor de cartas: base, tropas, energia, deck/mão, comando de jogar carta, alvos e movimento (seções 3 a 8), com testes |
| C2 | Combate jogável: mão com arrastar, barra de energia, HUD, câmera recortada, vitória/derrota e recompensas |
| C3 | Armas especiais e seus efeitos |
| C4 | Tela Deck: coleção, montar deck, níveis, desbloqueios e migração do progresso salvo |
| C5 | Arte nova: Bruno, Rex, Barricada, caminhonete, molduras de carta, ícones e efeitos |
| C6 | Feedback (seção 13), som, vibração e desempenho |
| C7 | Modo retrato: campo vertical aberto, unidades de frente, de costas e de perfil, base, arena e telas em pé |
| C8 | Estilo novo: arte vetorial cartoon gerada por código e interface escura com cartões coloridos (Rubik) |
| C9 | Deck no estilo Clash (Remover/Adicionar, deck incompleto bloqueia o jogo) e energia renomeada para sangue |
| C10 | Mundos: 5 mundos de 10 fases com cenário, zumbi e chefe próprios; 6 cartas novas; curva de dificuldade pela fase global |
| C11 | Acabamento Clash 2D: Lilita One com contorno, interface gordinha (Chunky), cartas com moldura dourada, unidades com silhueta e 8 quadros por animação, arenas quadriculadas |
| C12 | Nome Zombie Road, ícone do app (iOS e Android adaptável, com monocromático), splash e favicon gerados por código |
| C13 | Estrelas por fase (seção 17.1) |
| C14 | Aviso de melhoria e Ajustes (17.2) |
| C15 | Caminhonete melhorável: Oficina (17.3) |
| C16 | Zumbis com mecânicas novas: Cuspidor, Escavador, Divisor e Porta-escudo (17.4) |
| C17 | Eventos de cenário, um por mundo (17.5) |
| C18 | Evolução das cartas nos níveis 10 e 20 (17.6) |
| C19 | Bestiário (17.7) |
| C20 | Conquistas (17.8) |
| C21 | Modo Sobrevivência (17.9) |
| C22 | Animações de recompensa (17.10) |
| C23 | História: mensagens de rádio, prólogo e Diário (seção 18.1) |
| C24 | Ato 2: 3 mundos, zumbis, chefes, eventos e base blindada (18.2) |
| C25 | Armas do Ato 2: Drone, Cabo Laser, Exotraje Titã, Torre Tesla; teto de nível 40 (18.4) |
| C26 | Ato 3: 4 mundos espaciais, zumbis, chefes, eventos e módulo espacial (18.3) |
| C27 | Armas do Ato 3: Criogenia, Escudo de Energia, Buraco Negro, Canhão Orbital; teto 50 (18.4) |
| C28 | Fronteira infinita: planetas gerados com tema, ameaça e chefe mutado (18.5) |
| C29 | Balanceamento da campanha inteira e da Fronteira (18.6) |
| C30 | Servidor próprio, conta (convidado, Google, Apple), development build (docs/BACKEND.md) |
| C31 | Save na nuvem com conflito entre aparelhos e excluir conta |
| C32 | Loja: gemas (RevenueCat) e moedas por gemas (seção 19) |
| C33 | Passe de Batalha mensal (seção 19.3) |
| C34 | Propaganda premiada "Assista e dobre" (AdMob, seção 19.4) |

## 17. Expansão (C13 a C22)

Os números ficam em src/game/data; aqui vão as regras e os valores iniciais.

### 17.1 Estrelas por fase (C13)

- A vitória dá de 1 a 3 estrelas pela vida da base no fim: 70% ou mais = 3,
  35% ou mais = 2, abaixo disso = 1.
- Fica salva a melhor marca de cada fase (nunca diminui). Cada estrela nova
  paga 20 x s de bônus na hora (s = fase global).
- O modal de vitória mostra as estrelas e o bônus; a grade de fases mostra as
  estrelas de cada fase; a faixa do mundo, o total do mundo (n/30).

### 17.2 Aviso de melhoria e Ajustes (C14)

- Carta com dinheiro para subir de nível ganha uma seta verde no canto; o
  atalho Deck da Home mostra quantas cartas do deck podem melhorar.
- Ajustes (engrenagem na Home): som, vibração, números de dano e "Apagar
  progresso" (com confirmação). Salvos à parte do progresso.

### 17.3 Caminhonete melhorável (C15)

- Oficina (atalho na Home), com três peças, cada uma com nível e custo
  próprios:
  - Lataria: vida da base +15% por nível (máximo 20).
  - Metralhadora: dano da base x 1,12 por nível (máximo 20).
  - Tanque de sangue: sangue inicial +1 por nível (máximo 5, de 1 a 6).
- Custo da peça: base x crescimento^(nível - 1). Lataria e Metralhadora:
  60 x 1,25; Tanque: 400 x 2.

### 17.4 Zumbis com mecânicas novas (C16)

Aparecem misturados nas ondas de qualquer mundo, a partir de uma fase:

| Zumbi | Mecânica | A partir da fase |
| ----- | -------- | ---------------- |
| Cuspidor | Para a 150 da tropa e cospe ácido de longe; frágil | 8 |
| Escavador | Anda por baixo da terra (não pode ser alvo) e surge no meio do campo | 15 |
| Divisor | Ao morrer, vira 2 Pequenos (rápidos, 35% da vida) | 22 |
| Porta-escudo | Zumbis a até 90 dele levam 40% menos dano de golpes diretos; tem armadura | 30 |

### 17.5 Eventos de cenário (C17)

Um por mundo, nas ondas 2 e 4 de cada fase, entre 3 e 8 s depois do início
da onda. Um aviso aparece no topo do campo.

| Mundo | Evento | Efeito |
| ----- | ------ | ------ |
| Fazenda | Fardo rolando | Um fardo de feno desce uma coluna e fere os zumbis no caminho (50% da vida, chefes 10%) |
| Cidade | Carros-bomba | 2 carros aparecem na metade de cima e explodem quando um zumbi chega perto (ou em 12 s), ferindo todos no raio |
| Pântano | Névoa | 10 s: atiradores com alcance 40% menor |
| Deserto | Bombardeio | 4 bombas caem em pontos marcados 1,5 s antes, ferindo tropas e zumbis |
| Nevasca | Nevasca | 10 s: todos andam 40% mais devagar e o sangue enche 30% mais devagar |

### 17.6 Evolução das cartas (C18)

- Nos níveis 10 e 20 a carta evolui: a moldura muda (azul no 10, roxa no 20),
  a tropa ganha um anel da cor no chão e um efeito extra, mais forte no 20:

| Carta | Efeito (nível 10 / 20) |
| ----- | ---------------------- |
| Mira | O tiro atravessa 1 / 2 zumbis atrás do alvo |
| Xerife | A cada 3 / 2 tiros, um tiro extra |
| Bruno | +1 / +2 zumbis atingidos |
| Serra | Recupera 20% / 40% do dano que causa |
| Rex | A mordida deixa o zumbi 30% / 50% mais lento por 2 s |
| Barricada | Devolve 6 / 12 de dano a cada golpe recebido |
| Soldado | Ataca 15% / 30% mais rápido |
| Bombeiro | Deixa fogo no chão por 2 / 3 s onde acerta |
| Médica | Cada pulso também cura 5 / 10 de vida da base |
| Lara | O virote atravessa +2 / +4 zumbis |
| Torreta | Dura +10 / +20 s |
| Granada | Atordoa por 1 / 2 s |
| Kit médico | Também cura 5% / 10% da vida da base |
| Molotov | Fogo dura +2 / +4 s |
| Ataque aéreo | Cai em 1 / 0,5 s |
| Mina | Raio +20% / +40% |

### 17.7 Bestiário (C19)

- Atalho na Home. Grade com todos os zumbis; os que ainda não apareceram
  ficam em silhueta com "???". Tocar abre a ficha: retrato, nome, mecânica,
  vida, dano e velocidade (na fase 1) e quantos o jogador já derrotou.
- O progresso passa a guardar quantos zumbis de cada tipo foram derrotados.

### 17.8 Conquistas (C20)

- Atalho na Home, com um aviso quando há prêmio para resgatar.
- Cada conquista tem 3 marcos (bronze, prata e ouro) e paga dinheiro em cada
  um. Exemplos: zumbis derrotados (100 / 1.000 / 10.000), chefes derrotados,
  estrelas, fases vencidas, cartas jogadas, melhorias compradas, evoluções,
  peças da caminhonete e onda da Sobrevivência.
- O resgate é manual (botão "Resgatar" com o valor).

### 17.9 Modo Sobrevivência (C21)

- Libera ao vencer a fase 1-10. Atalho na Home, com o recorde.
- Ondas sem fim com o deck e os níveis de sempre. A onda n tem a dificuldade
  da fase n; a cada 5 ondas vem um chefe; o cenário muda a cada 10 ondas
  (Fazenda, Cidade, Pântano, Deserto, Nevasca e volta). Eventos de cenário a
  cada 3 ondas.
- Recompensa: o dinheiro dos zumbis e 15 x n por onda n vencida. O recorde
  (maior onda) fica salvo.

### 17.10 Animações de recompensa (C22)

- Vitória: as estrelas entram uma a uma com pulo e vibração; o dinheiro conta
  de 0 até o total.
- Melhoria de carta e de peça: brilho e o nível pulando. Resgate de
  conquista: moedas saltando. Recorde na Sobrevivência: carimbo "Novo
  recorde!".

## 18. História: "A estrada leva às estrelas" (C23 a C29)

Três atos de mundos com 10 fases cada (chefe na fase 10) e, depois do fim, a
Fronteira infinita. Os mundos 1 a 5 são o Ato 1.

| Ato | Mundos | Fases | Base | Teto de nível das cartas |
| --- | ------ | ----- | ---- | ------------------------ |
| 1 · A Estrada | Fazenda, Cidade em ruínas, Pântano, Base no deserto, Nevasca | 1 a 50 | Caminhonete | 30 |
| 2 · A Origem | Cidade Tecnológica, Laboratório, Base de Lançamento | 51 a 80 | Caminhonete blindada | 40 |
| 3 · O Espaço | Estação Orbital, Lua, Marte, Colmeia | 81 a 120 | Módulo espacial | 50 |
| Fronteira | Planetas gerados, sem fim | 121 em diante | Nave de exploração | +5 a cada mundo da Fronteira |

### 18.1 Mensagens de rádio e Diário (C23)

- A história é contada por mensagens de rádio: um modal com o retrato de quem
  fala, o nome e 1 a 3 falas. Aparece antes da primeira fase de cada mundo
  (abertura) e depois de vencer o chefe (fechamento), só na primeira vez.
- Vozes: Xerife (líder do grupo), Mira (atiradora) e a Doutora Vega
  (cientista, chega no fim do Ato 1).
- O Diário (atalho na Home) guarda as mensagens já ouvidas, por ato, para
  reler.
- Enredo: os sobreviventes cruzam o país na caminhonete (Ato 1). No fim da
  Nevasca, a Doutora Vega chama pelo rádio: uma sonda trouxe do espaço um
  esporo, que começou tudo. No Ato 2 eles vão atrás da origem (protótipos de
  armas, o laboratório, o foguete). No Ato 3 sobem ao espaço até a Colmeia,
  de onde veio o esporo, e derrotam a Rainha. Ela não era a única: a Fronteira
  é a caça às outras colmeias.

### 18.2 Ato 2 · A Origem (C24)

| Mundo | Zumbi do mundo | Chefe | Evento de cenário |
| ----- | -------------- | ----- | ----------------- |
| Cidade Tecnológica | Androide: tiros de arma de fogo tiram metade; elétrico, o dobro | Colosso (robô de obra infectado, blindado) | Apagão: escurece por 10 s, atiradores com alcance 40% menor |
| Laboratório | Mutante: aura que fere as tropas a até 70 | Diretor do Laboratório (aura forte) | Vazamento: nuvem tóxica por 8 s que fere tropas e zumbis |
| Base de Lançamento | Astronauta: o traje absorve dano até o capacete trincar; depois leva o dobro | Chefe de Pista (tanque de combustível que explode ao cair) | Teste de motores: jato de fogo atravessa uma linha do campo e queima os zumbis |

### 18.3 Ato 3 · O Espaço (C26)

| Mundo | Zumbi do mundo | Chefe | Evento de cenário |
| ----- | -------------- | ----- | ----------------- |
| Estação Orbital | Cosmonauta: flutua por cima de tropas e barricadas, vai direto na base | Comandante da Missão (jetpack: também passa por cima) | Chuva de detritos: 6 pedaços caem em pontos marcados |
| Lua | Cosmonauta e Astronauta (gravidade baixa) | Verme Lunar (anda por baixo da terra e surge perto da base) | Chuva de meteoros: 3 meteoros grandes em pontos marcados |
| Marte | Xeno: rápido, vem em trios | Titã Marciano (fica com o dobro da velocidade abaixo de metade da vida) | Tempestade de poeira: 10 s, todos mais lentos e atiradores com alcance menor |
| Colmeia | Casulo: parado, solta uma larva a cada 4 s até ser destruído | Rainha Colmeia (solta 2 larvas a cada 6 s) | Esporos: 3 casulos brotam na metade de cima do campo |

### 18.4 Armas sci-fi (C25 e C27)

| Carta | Tipo | Libera na fase | Mecânica |
| ----- | ---- | -------------- | -------- |
| Drone | Tropa | 53 (6-3) | Voa: só zumbis que atacam de longe o atingem; tiro rápido e fraco |
| Torre Tesla | Tropa (construção) | 58 (6-8) | Raio que pula para até 3 zumbis perto do alvo; elétrico |
| Cabo Laser | Tropa | 65 (7-5) | Raio contínuo que atravessa a fila de zumbis |
| Exotraje Titã | Tropa | 74 (8-4) | Corpo a corpo, muita vida; cada golpe empurra o zumbi para trás |
| Criogenia | Especial | 84 (9-4) | Congela os zumbis da área (atordoa 2 s e deixa lentos) |
| Escudo de Energia | Especial | 92 (10-2) | Parede de energia que segura os zumbis até quebrar ou acabar o tempo |
| Buraco Negro | Especial | 103 (11-3) | Puxa os zumbis para o centro por 3 s e esmaga no fim |
| Canhão Orbital | Especial | 112 (12-2) | Depois de 1 s, um raio do céu acerta a coluna inteira do campo |

As armas novas também evoluem nos níveis 10 e 20 (efeitos definidos na etapa
de cada uma).

### 18.5 Fronteira infinita (C28)

- A partir da fase 121, cada mundo é um planeta montado por um gerador com
  semente (o mundo n é sempre igual): tipo de planeta (Gelo, Lava, Selva
  Alienígena, Cristal), um tema (Noite, Tempestade, Tóxico, Em chamas) e uma
  ameaça da horda (Horda rápida, Blindados, Infestação, Enxame, Sem descanso),
  mais forte quanto mais longe.
- Zumbis: mistura dos zumbis dos atos anteriores, sorteada pela semente; o
  chefe é um chefe dos atos anteriores com uma mutação (Gigante, Blindado,
  Explosivo, Regenera).
- Nome gerado (ex.: "Planeta de Lava · Tóxico"). Fases e estrelas sem limite.
- Cada planeta reaproveita a arena e a base de um mundo do Ato 3 com um tom de
  cor por cima: Gelado (Lua, azul), Lava (Marte, laranja), Selva Alienígena
  (Colmeia, verde) e Cristal (Estação, roxo), com o evento desse mundo.
- Ameaças, mais fortes a cada 3 mundos da Fronteira: Horda rápida (+15% de
  velocidade), Blindados (+3 de armadura), Infestação (+1 de cada especial),
  Enxame (+25% de andarilhos) e Sem descanso (spawns 40% mais juntos).
- Mutações do chefe: Gigante (vida x1,5, maior), Blindado (+12 de armadura),
  Explosivo (explode ao cair) e Que se regenera (1% da vida por segundo).

### 18.6 Progressão e balanceamento (C29)

- O teto de nível das cartas sobe ao entrar em cada ato (tabela acima); na
  Fronteira, +5 a cada mundo.
- Depois da fase 50, a quantidade de zumbis por onda para de crescer (fica no
  patamar da fase 50); a vida e o dano seguem a curva da seção 8, e o desafio
  vem dos zumbis novos, dos eventos e, na Fronteira, das ameaças e mutações.
- Simulação com o jogador simples e o deck inicial (todas as cartas no mesmo
  nível, sangue começando em 1 e +1 a cada 3,5 s): fase 80 no nível 32, 90 no 34,
  100 no 36, 110 no 37. A fase 120 (Rainha Colmeia) não foi vencida pelo bot nem no
  nível 60: o chefe final precisa de ajuste com o sangue mais lento.
- Cosmonauta e Comandante passam por cima das tropas; o Casulo e o evento
  Esporos aparecem no meio do campo; Xenos vêm em trios (por isso Marte tem 40%
  e a Colmeia 50% da quantidade normal do zumbi do mundo).

## 19. Loja e monetização (C30 a C34)

Arquitetura e configuração em docs/BACKEND.md. Números em packages/shared/src/catalog.ts e
pass.ts (os mesmos no app e no servidor).

### 19.1 Gemas (moeda premium)

- Compradas com dinheiro (App Store / Google Play via RevenueCat) e guardadas só no
  servidor: valem em todos os aparelhos da conta. Preços sugeridos (definidos nas lojas):

| Produto | Gemas | Preço sugerido |
| ------- | ----- | -------------- |
| zr_gems_80 | 80 | R$ 4,90 |
| zr_gems_500 | 500 (Popular) | R$ 24,90 |
| zr_gems_1200 | 1.200 | R$ 49,90 |
| zr_gems_2600 | 2.600 | R$ 99,90 |
| zr_gems_7000 | 7.000 (Melhor valor) | R$ 249,90 |

### 19.2 Moedas por gemas

- Saco (60 gemas), Baú (300, +10%) e Cofre (1.200, +20%). Cada gema vale
  25 x (1 + 0,08 x (fase - 1)) moedas, a mesma curva da recompensa dos zumbis: o pacote
  continua útil em qualquer ponto do jogo (60 gemas ≈ uma fase vencida).

### 19.3 Passe de Batalha (assinatura mensal)

- Assinatura `zr_pass_monthly` (sugestão: R$ 19,90/mês). Temporada = mês do calendário
  (UTC), 30 níveis de 100 XP, trilha grátis e premium; o premium libera também os níveis
  já alcançados antes de assinar.
- XP: vitória 40 + 10 por estrela, derrota 15, Sobrevivência 5 por onda (até 100).
  Teto de 600 XP por dia.
- Prêmios: moedas em quase todos os níveis (grátis 100 + 10 x nível, premium 250 + 10 x
  nível, crescendo com a fase do jogador); gemas na grátis nos níveis 10, 20 e 30 (15
  cada) e na premium nos 5, 10, 15, 20 e 25 (40 cada) e 30 (150): 350 gemas por mês.

### 19.4 Propagandas

- Só premiadas e só quando o jogador escolhe: no fim de cada partida (vitória, derrota
  ou Sobrevivência), "Assistir e dobrar (+N)" soma de novo as moedas da partida. Até 10
  vezes por dia. Nenhuma propaganda forçada.
- Antes da primeira, o pedido de consentimento (LGPD/GDPR e o aviso de rastreamento do
  iOS), pelo SDK do AdMob.

### 19.5 Conta

- Todo aparelho começa como convidado (sem pedir nada). "Entrar com Google" (e "Entrar
  com Apple" no iOS, exigência da Apple) salva na nuvem e leva o progresso para outros
  aparelhos. Ajustes: entrar, sair, excluir conta e quando foi o último save na nuvem.


## 20. Notificações (C35)

Avisos curtos, na voz do rádio quando dá, para trazer o jogador de volta sem incomodar. Regras
para todos: no máximo 1 por dia, só entre 9h e 21h (hora do jogador) e cada categoria liga e
desliga em Ajustes. Contrato comum em packages/shared/src/push.ts.

### 20.1 Locais (o aparelho agenda ao sair do app)

Ao abrir o app, tudo o que estava agendado é cancelado; ao sair, o plano é refeito com o
progresso de agora. Funcionam offline e no Expo Go (iOS).

| Aviso | Quando | Categoria | Abre |
| ----- | ------ | --------- | ---- |
| Volta para a estrada (Xerife, Mira, Doutora Vega) | 1, 3 e 7 dias depois, no mesmo horário | Progresso | Home |
| Melhoria disponível | dia 1 ou 2, se já der para subir uma carta do deck | Progresso | Deck |
| Prêmios no Passe | dia 1 ou 2, se houver prêmio para resgatar | Passe | Passe |
| Fim da temporada | 3 dias e 1 dia antes do fim, às 18h, se houver prêmio pendente | Passe | Passe |
| Novo dia | dia 1 ou 2, se hoje bateu o teto de XP do Passe ou usou os 10 dobros | Progresso | Home |
| Recorde da Sobrevivência | no lugar do aviso do dia 3, para quem já jogou | Progresso | Home |

Quando dois avisos caem no mesmo dia, fica o mais importante: fim da temporada, depois os do
dia 1 e 2 (prêmios, melhoria, novo dia) e por último a volta para a estrada. Horário fora da
janela é puxado para dentro do mesmo dia (madrugada vira 9h, noite vira 20h). Nada na primeira
hora depois de sair.

### 20.2 Remotos (o servidor manda)

Só no development build e no aparelho de verdade (o Expo Go e o simulador não recebem push
remoto). O app registra o token da Expo, o fuso e as categorias; o servidor guarda os avisos
numa fila e manda pelo serviço de push da Expo.

| Aviso | Quando | Categoria | Abre |
| ----- | ------ | --------- | ---- |
| Compra confirmada (gemas ou Passe) | o webhook do RevenueCat confirmou; chega na hora, a qualquer hora | Compras | Loja |
| Problema no pagamento do Passe | a loja não conseguiu renovar (BILLING_ISSUE) | Compras | Passe |
| Nova temporada | nos 3 primeiros dias do mês, uma vez | Passe | Passe |
| Novidades | enviado pela administração (`POST /admin/push`) | Novidades | a rota escolhida |

A compra confirmada é urgente: ignora a janela e o limite diário. Os outros esperam a janela do
dia e pelo menos 20 h desde o último aviso remoto da conta; depois de 3 dias sem conseguir sair,
o aviso vence. Com o app aberto, a compra confirmada não aparece (a loja já mostra) e só atualiza
as gemas.

### 20.3 Permissão e Ajustes

- Depois da primeira vitória, a Home pergunta uma vez ("Avisos do rádio": "Quero avisos" ou
  "Agora não"); só quem aceita vê o pedido do sistema.
- Ajustes, seção Notificações: sem permissão, um botão "Ativar" (ou "Abrir", que leva aos
  ajustes do celular quando o sistema já recusou); com permissão, as chaves Progresso, Passe de
  Batalha, Compras e Novidades.
- Android: canal "Avisos do rádio" e ícone branco do zumbi (scripts/art/brand.mjs).
