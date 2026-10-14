import { language } from './locale';
const dictionaries = {
 pt: { title: 'Desafio semanal', hint: 'Deck e níveis fixos para todos. Medalhas confirmadas por reprodução da partida no servidor; sem ranking público.', start: 'Iniciar desafio', checking: 'Conferindo partida…', error: 'Não foi possível conferir. Tente novamente.', retry: 'Verificar resultado', medal: 'Medalha', done: 'Partida conferida', ends: 'Termina em' },
 en: { title: 'Weekly challenge', hint: 'The same deck and levels for everyone. Medals confirmed by server replay; no public leaderboard.', start: 'Start challenge', checking: 'Checking match…', error: 'Could not verify. Try again.', retry: 'Check result', medal: 'Medal', done: 'Match verified', ends: 'Ends on' },
 es: { title: 'Desafío semanal', hint: 'Mismo mazo y niveles para todos. Medallas confirmadas al reproducir la partida en el servidor; sin clasificación pública.', start: 'Iniciar desafío', checking: 'Verificando partida…', error: 'No se pudo verificar. Reintenta.', retry: 'Verificar resultado', medal: 'Medalla', done: 'Partida verificada', ends: 'Termina el' },
};
export const weeklyText = new Proxy({} as typeof dictionaries.pt, { get: (_target, key) => dictionaries[language][key as keyof typeof dictionaries.pt] });
