import type { Speaker } from '@/game/data/story';

// Mensagens de rádio da história (GDD seção 18.1): abertura (intro) e fechamento (outro) de
// cada mundo e a chegada na Fronteira. Ids em src/game/data/story.ts (radioId).

export type RadioLine = { speaker: Speaker; text: string };
const say = (speaker: Speaker, text: string): RadioLine => ({ speaker, text });

export const RADIO_MESSAGES: Record<string, RadioLine[]> = {
  'w1-intro': [
    say('sheriff', 'Aqui é o Xerife. A cidade caiu de vez. Vamos pegar a estrada com o que sobrou.'),
    say('sniper', 'A caminhonete aguenta o tranco. Eu cuido de quem chegar perto.'),
    say('sheriff', 'Montem as tropas na frente do muro e não deixem a horda passar.'),
  ],
  'w1-outro': [say('sheriff', 'O Brutamontes caiu. Próxima parada: a cidade. Precisamos de combustível e munição.')],
  'w2-intro': [say('sniper', 'Ruas cheias deles... e alguns ainda usam farda.'), say('sheriff', 'Policial ou não, ninguém passa.')],
  'w2-outro': [say('sheriff', 'O rádio da delegacia pegou um sinal estranho vindo do sul. Vamos seguir.')],
  'w3-intro': [say('sheriff', 'O sinal vem do outro lado do pântano. Cuidado com os inchados: eles explodem.')],
  'w3-outro': [say('sniper', 'Olha o que o Monstro do Pântano carregava: um crachá de laboratório. "Projeto Esporo".')],
  'w4-intro': [say('sheriff', 'Uma base militar abandonada. Se alguém sabe o que está acontecendo, é aqui.')],
  'w4-outro': [
    say('sniper', 'Os arquivos do General falam de uma sonda que caiu do céu, meses antes de tudo.'),
    say('sheriff', 'Do céu? Então isso não começou aqui...'),
  ],
  'w5-intro': [say('sniper', 'Frio demais... e eles nem sentem.'), say('sheriff', 'Fiquem perto da caminhonete. Ninguém se perde na neve.')],
  'w5-outro': [
    say('static', '...alguém na escuta? Aqui é a Doutora Vega.'),
    say('vega', 'Eu estudei aquela sonda. Ela trouxe um esporo do espaço: foi assim que tudo começou.'),
    say('vega', 'Venham para a Cidade Tecnológica. Tenho armas que podem ajudar.'),
  ],
  'w6-intro': [
    say('vega', 'Bem-vindos! O esporo não infecta só gente: pega as máquinas também.'),
    say('vega', 'Testem os protótipos do meu laboratório. A Torre Tesla frita circuito infectado.'),
  ],
  'w6-outro': [
    say('vega', 'O Colosso era um robô de obra. Se até ele virou, nada aqui está seguro.'),
    say('sheriff', 'Então vamos atrás da fonte. Onde fica o seu laboratório?'),
  ],
  'w7-intro': [
    say('vega', 'Meu antigo laboratório. As amostras ficaram aqui... e os meus colegas também.'),
    say('sniper', 'Esses mutantes queimam só de chegar perto. Cuidado com as tropas.'),
  ],
  'w7-outro': [
    say('vega', 'Achei o mapa da missão no escritório do Diretor.'),
    say('vega', 'O esporo veio de uma colmeia em órbita de Marte. E ela ainda está viva.'),
  ],
  'w8-intro': [say('vega', 'A Base de Lançamento. Temos um foguete pronto.'), say('sheriff', 'Então seguramos a horda até a contagem acabar.')],
  'w8-outro': [
    say('vega', 'Combustível no máximo. Decolagem autorizada!'),
    say('sheriff', 'E a caminhonete, Doutora?'),
    say('vega', 'Vai junto. Encaixei a torreta no módulo.'),
  ],
  'w9-intro': [
    say('vega', 'Estação orbital à vista. A tripulação... não responde.'),
    say('sniper', 'Sem gravidade eles flutuam por cima das barricadas. Mirem antes que cheguem.'),
  ],
  'w9-outro': [say('sniper', 'O Comandante tinha os códigos da base lunar.'), say('vega', 'Próxima parada: a Lua.')],
  'w10-intro': [say('vega', 'Gravidade baixa: eles pulam longe. E algo enorme cava por baixo do solo.')],
  'w10-outro': [
    say('vega', 'O Verme Lunar abriu túneis até a antena. O sinal da Colmeia está mais forte.'),
    say('sheriff', 'Marte, então.'),
  ],
  'w11-intro': [
    say('sheriff', 'Vermelho até onde a vista alcança... e uma tempestade chegando.'),
    say('vega', 'Esses xenos não são zumbis de gente. São o que a Colmeia cria.'),
  ],
  'w11-outro': [say('vega', 'Encontrei a Colmeia. Ela é viva e chama por eles.'), say('sniper', 'Então a gente vai lá calar essa coisa.')],
  'w12-intro': [
    say('vega', 'É aqui que tudo começou. Destruam os casulos antes que eclodam.'),
    say('vega', 'E a Rainha... ela não pode sair daqui.'),
  ],
  'w12-outro': [
    say('vega', 'A Rainha caiu! Os esporos estão morrendo...'),
    say('vega', '...mas o rádio está captando outros sinais. Outras colmeias, em outros planetas.'),
    say('sheriff', 'Então a estrada continua. Todo mundo de volta pra nave.'),
  ],
  frontier: [
    say('vega', 'Bem-vindos à Fronteira. Cada planeta é diferente, e as colmeias ficam mais fortes.'),
    say('sheriff', 'Quanto mais longe, melhor a recompensa. Vamos nessa.'),
  ],
};
