import { language } from './locale';
const texts = {
  pt: {
    title: 'Gemas por anúncios', hint: 'Assista até o fim e receba gemas na sua conta.',
    reward: (n: number) => `+${n} gemas por anúncio`, left: (n: number, limit: number) => `${n} de ${limit} anúncios disponíveis hoje`,
    watch: 'Assistir e ganhar gemas', busy: 'Preparando anúncio ou confirmando recompensa…',
    pending: 'Aguardando confirmação do anúncio. Verifique a recompensa sem assistir novamente.', check: 'Verificar recompensa',
    earned: 'Gemas recebidas!', cancelled: 'Anúncio não concluído ou indisponível. Nenhuma gema foi adicionada por esta tentativa.',
    failed: 'Não foi possível verificar a recompensa. Confira sua conexão e tente novamente.',
    limit: 'Limite diário atingido.', reset: (date: string) => `Novos anúncios em ${date}. Reinício diário às 00:00 UTC.`,
    member: 'Sua assinatura remove todos os anúncios. Você recebe 500 gemas e 10.000 moedas a cada ciclo mensal pago.',
    unavailable: 'Anúncios de gemas indisponíveis no momento.', retired: 'O passe não está mais à venda. Benefícios de compras anteriores continuam válidos pelo período já pago.',
    passHint: 'Ganhe XP jogando e resgate moedas. A trilha premium permanece para quem já comprou esta temporada.',
  },
  en: {
    title: 'Gems from ads', hint: 'Watch until the end to receive gems in your account.', reward: (n: number) => `+${n} gems per ad`,
    left: (n: number, limit: number) => `${n} of ${limit} ads available today`, watch: 'Watch and earn gems', busy: 'Preparing ad or confirming reward…',
    pending: 'Waiting for ad confirmation. Check your reward without watching again.', check: 'Check reward', earned: 'Gems received!',
    cancelled: 'Ad incomplete or unavailable. No gems were added for this attempt.', failed: 'Could not verify the reward. Check your connection and retry.',
    limit: 'Daily limit reached.', reset: (date: string) => `More ads at ${date}. Daily reset at 00:00 UTC.`,
    member: 'Your subscription removes all ads. You receive 500 gems and 10,000 coins per paid monthly cycle.',
    unavailable: 'Gem ads are currently unavailable.', retired: 'The pass is no longer for sale. Previous purchases remain valid for the paid period.',
    passHint: 'Earn XP by playing and claim coins. The premium track remains available to owners of this season.',
  },
  es: {
    title: 'Gemas por anuncios', hint: 'Mira hasta el final para recibir gemas en tu cuenta.', reward: (n: number) => `+${n} gemas por anuncio`,
    left: (n: number, limit: number) => `${n} de ${limit} anuncios disponibles hoy`, watch: 'Ver y ganar gemas', busy: 'Preparando anuncio o confirmando recompensa…',
    pending: 'Esperando confirmación del anuncio. Verifica la recompensa sin volver a verlo.', check: 'Verificar recompensa', earned: '¡Gemas recibidas!',
    cancelled: 'Anuncio incompleto o no disponible. No se añadieron gemas por este intento.', failed: 'No se pudo verificar la recompensa. Comprueba tu conexión y reintenta.',
    limit: 'Límite diario alcanzado.', reset: (date: string) => `Más anuncios el ${date}. Reinicio diario a las 00:00 UTC.`,
    member: 'Tu suscripción elimina todos los anuncios. Recibes 500 gemas y 10.000 monedas por ciclo mensual pagado.',
    unavailable: 'Los anuncios de gemas no están disponibles ahora.', retired: 'El pase ya no está a la venta. Las compras anteriores siguen vigentes durante el período pagado.',
    passHint: 'Gana XP jugando y reclama monedas. La ruta premium sigue disponible para quienes compraron esta temporada.',
  },
};
export const gemRewardsText = new Proxy({} as typeof texts.pt, { get: (_target, key) => texts[language][key as keyof typeof texts.pt] });
