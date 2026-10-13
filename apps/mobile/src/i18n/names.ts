import { language } from './locale';

const names: Record<string, readonly [string, string]> = {
  'Fazenda': ['Farm', 'Granja'],
  'Cidade em ruínas': ['Ruined City', 'Ciudad en ruinas'], 'Pântano': ['Swamp', 'Pantano'],
  'Base no deserto': ['Desert Base', 'Base del Desierto'], 'Nevasca': ['Blizzard', 'Ventisca'],
  'Cidade Tecnológica': ['Tech City', 'Ciudad Tecnológica'], 'Laboratório': ['Laboratory', 'Laboratorio'],
  'Base de Lançamento': ['Launch Site', 'Base de Lanzamiento'], 'Estação Orbital': ['Orbital Station', 'Estación Orbital'],
  'Lua': ['Moon', 'Luna'], 'Marte': ['Mars', 'Marte'], 'Colmeia': ['Hive', 'Colmena'],
  'Planeta Gelado': ['Ice Planet', 'Planeta Helado'], 'Planeta de Lava': ['Lava Planet', 'Planeta de Lava'],
  'Selva Alienígena': ['Alien Jungle', 'Selva Alienígena'], 'Planeta de Cristal': ['Crystal Planet', 'Planeta de Cristal'],
  'Xerife': ['Sheriff', 'Sheriff'], 'Serra': ['Saw', 'Sierra'], 'Barricada': ['Barricade', 'Barricada'],
  'Soldado': ['Soldier', 'Soldado'], 'Bombeiro': ['Firefighter', 'Bombero'], 'Médica': ['Medic', 'Médica'],
  'Torreta': ['Turret', 'Torreta'], 'Torre Tesla': ['Tesla Tower', 'Torre Tesla'],
  'Cabo Laser': ['Laser Corporal', 'Cabo Láser'], 'Exotraje Titã': ['Titan Exosuit', 'Exotraje Titán'],
  'Granada': ['Grenade', 'Granada'], 'Kit médico': ['Medkit', 'Botiquín'], 'Ataque aéreo': ['Airstrike', 'Ataque aéreo'],
  'Mina': ['Landmine', 'Mina'], 'Criogenia': ['Cryogenics', 'Criogenia'],
  'Escudo de Energia': ['Energy Shield', 'Escudo de Energía'], 'Buraco Negro': ['Black Hole', 'Agujero Negro'],
  'Canhão Orbital': ['Orbital Cannon', 'Cañón Orbital'],
  'Revólver': ['Revolver', 'Revólver'], 'Escopeta': ['Shotgun', 'Escopeta'], 'Motosserra': ['Chainsaw', 'Motosierra'],
  'Mordida': ['Bite', 'Mordida'], 'Madeira e arame': ['Wood and wire', 'Madera y alambre'],
  'Metralhadora': ['Machine gun', 'Ametralladora'], 'Lança-chamas': ['Flamethrower', 'Lanzallamas'],
  'Maleta': ['Medical bag', 'Maletín'], 'Besta': ['Crossbow', 'Ballesta'],
  'Metralhadora automática': ['Automatic machine gun', 'Ametralladora automática'],
  'Metralhadora leve': ['Light machine gun', 'Ametralladora ligera'], 'Bobina': ['Coil', 'Bobina'],
  'Rifle laser': ['Laser rifle', 'Rifle láser'], 'Punhos hidráulicos': ['Hydraulic fists', 'Puños hidráulicos'],
  'Andarilho': ['Walker', 'Caminante'], 'Corredor': ['Runner', 'Corredor'], 'Brutamontes': ['Brute', 'Bruto'],
  'Policial': ['Cop', 'Policía'], 'Blindadão': ['Riot Brute', 'Blindado'], 'Inchado': ['Bloater', 'Hinchado'],
  'Monstro do Pântano': ['Swamp Monster', 'Monstruo del Pantano'], 'Recruta': ['Grunt', 'Recluta'],
  'Congelado': ['Frozen', 'Congelado'], 'Abominável': ['Yeti', 'Abominable'], 'Cuspidor': ['Spitter', 'Escupidor'],
  'Escavador': ['Digger', 'Excavador'], 'Divisor': ['Splitter', 'Divisor'], 'Pequeno': ['Splitling', 'Pequeño'],
  'Porta-escudo': ['Shield Bearer', 'Portaescudo'], 'Androide': ['Android', 'Androide'], 'Colosso': ['Colossus', 'Coloso'],
  'Mutante': ['Mutant', 'Mutante'], 'Diretor do Laboratório': ['Lab Director', 'Director del Laboratorio'],
  'Astronauta': ['Astronaut', 'Astronauta'], 'Chefe de Pista': ['Launch Chief', 'Jefe de la Base'],
  'Cosmonauta': ['Cosmonaut', 'Cosmonauta'], 'Comandante da Missão': ['Mission Commander', 'Comandante de la Misión'],
  'Verme Lunar': ['Lunar Worm', 'Gusano Lunar'], 'Titã Marciano': ['Mars Titan', 'Titán Marciano'],
  'Casulo': ['Pod', 'Capullo'], 'Rainha Colmeia': ['Hive Queen', 'Reina de la Colmena'],
  'Caçador': ['Hunter', 'Cazador'], 'Mata-chefes': ['Boss Hunter', 'Cazajefes'], 'Estrelado': ['Star Collector', 'Estelar'],
  'Estradeiro': ['Road Warrior', 'Caminante de la Carretera'], 'Mão rápida': ['Quick Hand', 'Mano Rápida'],
  'Treinador': ['Trainer', 'Entrenador'], 'Evolução': ['Evolution', 'Evolución'], 'Mecânico': ['Mechanic', 'Mecánico'],
  'Sobrevivente': ['Survivor', 'Superviviente'], 'Lataria': ['Hull', 'Carrocería'],
  'Tanque de sangue': ['Blood tank', 'Tanque de sangre'],
};

/** Localiza nomes de conteúdo sem alterar ids, regras ou dados salvos. */
export function localizedName(value: string): string {
  if (language === 'pt') return value;
  return names[value]?.[language === 'en' ? 0 : 1] ?? value;
}
