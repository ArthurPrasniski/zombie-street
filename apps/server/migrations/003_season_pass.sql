-- Passe de temporada: cada transação libera uma temporada específica; sem renovação.
create table pass_purchases (
  transaction_id text primary key,
  user_id uuid references users(id) on delete set null,
  product_id text not null,
  season text not null,
  purchased_at timestamptz not null,
  refunded boolean not null default false
);
create index pass_purchases_user_season on pass_purchases (user_id, season);

-- Conserva XP e resgates do passe mensal de outubro na primeira temporada de 90 dias.
insert into pass_progress (user_id, season, xp, claimed_free, claimed_premium, xp_day, xp_today)
select user_id, '2026-10-13', xp, claimed_free, claimed_premium, xp_day, xp_today
from pass_progress where season = '2026-10'
on conflict do nothing;
