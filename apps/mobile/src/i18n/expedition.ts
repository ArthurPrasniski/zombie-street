import { language } from './locale';
const dictionaries = {
 pt: { title: 'Expedição', hint: 'Após cada chefe, escolha uma vantagem só para esta partida. Libera na fase 2–10. Moedas: 75% da Sobrevivência.', choose: 'Escolha sua vantagem', blood: 'Sangue +15%', attack: 'Dano das tropas +10%', repair: 'Reparar 25% da vida máxima', hull: 'Vida máxima da base +10%', play: 'Iniciar expedição' },
 en: { title: 'Expedition', hint: 'After each boss, choose a bonus for this run only. Unlocks at stage 2–10. Coins: 75% of Survival.', choose: 'Choose your bonus', blood: 'Blood +15%', attack: 'Troop damage +10%', repair: 'Repair 25% maximum health', hull: 'Base maximum health +10%', play: 'Start expedition' },
 es: { title: 'Expedición', hint: 'Tras cada jefe, elige una ventaja solo para esta partida. Se desbloquea en la fase 2–10. Monedas: 75% de Supervivencia.', choose: 'Elige tu ventaja', blood: 'Sangre +15%', attack: 'Daño de tropas +10%', repair: 'Reparar 25% de vida máxima', hull: 'Vida máxima de la base +10%', play: 'Iniciar expedición' },
};
export const expeditionText = new Proxy({} as typeof dictionaries.pt, { get: (_target,key) => dictionaries[language][key as keyof typeof dictionaries.pt] });
