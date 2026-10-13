import type { Speaker } from '@/game/data/story';

// Mensagens de rádio da história (GDD seção 18.1): abertura (intro) e fechamento (outro) de
// cada mundo e a chegada na Fronteira. Ids em src/game/data/story.ts (radioId).

export type RadioLine = { speaker: Speaker; text: string };
const say = (speaker: Speaker, text: string): RadioLine => ({ speaker, text });

export const RADIO_MESSAGES: Record<string, RadioLine[]> = {
  'w1-intro': [
    say('sheriff', "Aquí el Sheriff. La ciudad ha caído. Saldremos a la carretera con lo que queda."),
    say('sniper', "La camioneta aguanta. Yo me encargo de quien se acerque."),
    say('sheriff', "Desplieguen tropas delante del muro y no dejen pasar a la horda."),
  ],
  'w1-outro': [say('sheriff', "El Bruto cayó. Próxima parada: la ciudad. Necesitamos combustible y munición.")],
  'w2-intro': [say('sniper', "Las calles están llenas de ellos... y algunos aún llevan uniforme."), say('sheriff', "Policía o no, nadie pasa.")],
  'w2-outro': [say('sheriff', "La radio de la comisaría captó una señal extraña del sur. Vamos a seguirla.")],
  'w3-intro': [say('sheriff', "La señal viene del otro lado del pantano. Cuidado con los hinchados: explotan.")],
  'w3-outro': [say('sniper', "Mira lo que llevaba el Monstruo del Pantano: una credencial de laboratorio. \"Proyecto Espora\".")],
  'w4-intro': [say('sheriff', "Una base militar abandonada. Si alguien sabe qué está pasando, es aquí.")],
  'w4-outro': [
    say('sniper', "Los archivos del General hablan de una sonda que cayó del cielo meses antes de todo esto."),
    say('sheriff', "¿Del cielo? Entonces esto no empezó aquí..."),
  ],
  'w5-intro': [say('sniper', "Demasiado frío... y ellos ni lo sienten."), say('sheriff', "Quédense cerca de la camioneta. Nadie se pierde en la nieve.")],
  'w5-outro': [
    say('static', "...¿alguien escucha? Aquí la Doctora Vega."),
    say('vega', "Estudié esa sonda. Trajo una espora del espacio: así empezó todo."),
    say('vega', "Vengan a la Ciudad Tecnológica. Tengo armas que pueden ayudar."),
  ],
  'w6-intro': [
    say('vega', "¡Bienvenidos! La espora no solo infecta a personas: también a las máquinas."),
    say('vega', "Prueben los prototipos de mi laboratorio. La Torre Tesla fríe circuitos infectados."),
  ],
  'w6-outro': [
    say('vega', "El Coloso era un robot de obra. Si él también cayó, nada aquí está a salvo."),
    say('sheriff', "Entonces busquemos la fuente. ¿Dónde está su laboratorio?"),
  ],
  'w7-intro': [
    say('vega', "Mi antiguo laboratorio. Las muestras se quedaron aquí... y mis compañeros también."),
    say('sniper', "Estos mutantes queman con solo acercarse. Cuidado con las tropas."),
  ],
  'w7-outro': [
    say('vega', "Encontré el mapa de la misión en la oficina del Director."),
    say('vega', "La espora vino de una colmena en órbita de Marte. Y aún está viva."),
  ],
  'w8-intro': [say('vega', "La Base de Lanzamiento. Tenemos un cohete listo."), say('sheriff', "Entonces detenemos a la horda hasta que termine la cuenta atrás.")],
  'w8-outro': [
    say('vega', "Combustible al máximo. ¡Despegue autorizado!"),
    say('sheriff', "¿Y la camioneta, Doctora?"),
    say('vega', "Viene también. Encajé la torreta en el módulo."),
  ],
  'w9-intro': [
    say('vega', "Estación orbital a la vista. La tripulación... no responde."),
    say('sniper', "Sin gravedad flotan sobre las barricadas. Disparen antes de que lleguen."),
  ],
  'w9-outro': [say('sniper', "El Comandante tenía los códigos de la base lunar."), say('vega', "Próxima parada: la Luna.")],
  'w10-intro': [say('vega', "Gravedad baja: saltan lejos. Y algo enorme cava bajo el suelo.")],
  'w10-outro': [
    say('vega', "El Gusano Lunar abrió túneles hasta la antena. La señal de la Colmena es más fuerte."),
    say('sheriff', "Marte, entonces."),
  ],
  'w11-intro': [
    say('sheriff', "Rojo hasta donde alcanza la vista... y se acerca una tormenta."),
    say('vega', "Estos xenos no son zombis humanos. Son lo que crea la Colmena."),
  ],
  'w11-outro': [say('vega', "Encontré la Colmena. Está viva y los llama."), say('sniper', "Entonces iremos a silenciar esa cosa.")],
  'w12-intro': [
    say('vega', "Aquí empezó todo. Destruyan los capullos antes de que eclosionen."),
    say('vega', "Y la Reina... no puede salir de aquí."),
  ],
  'w12-outro': [
    say('vega', "¡La Reina cayó! Las esporas están muriendo..."),
    say('vega', "...pero la radio capta otras señales. Otras colmenas en otros planetas."),
    say('sheriff', "Entonces la carretera continúa. Todos de vuelta a la nave."),
  ],
  frontier: [
    say('vega', "Bienvenidos a la Frontera. Cada planeta es diferente y las colmenas se hacen más fuertes."),
    say('sheriff', "Cuanto más lejos, mejores los premios. Vamos allá."),
  ],
};
