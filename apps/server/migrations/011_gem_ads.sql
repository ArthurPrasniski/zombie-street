-- Reservations and verified gem rewards. Old purchases and ledger entries stay intact.
create table gem_ad_tickets (
  request_id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  reward_day text not null,
  gems int not null check (gems > 0),
  created_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','earned','cancelled')),
  transaction_id text unique,
  earned_at timestamptz
);
create index gem_ad_daily on gem_ad_tickets(user_id,reward_day,status);
