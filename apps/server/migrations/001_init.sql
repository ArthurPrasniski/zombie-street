-- Zombie Road: contas, save na nuvem, carteira de gemas, compras, assinatura do passe e
-- progresso do passe (docs/BACKEND.md).

create table users (
  id uuid primary key default gen_random_uuid(),
  -- Convidado: id aleatório gerado pelo aparelho (funciona como senha do convidado)
  device_id text unique,
  email text,
  name text,
  created_at timestamptz not null default now()
);

create table identities (
  provider text not null check (provider in ('google', 'apple')),
  subject text not null,
  user_id uuid not null references users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  primary key (provider, subject)
);
create index identities_user on identities(user_id);

create table saves (
  user_id uuid primary key references users(id) on delete cascade,
  revision int not null,
  version int not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table wallets (
  user_id uuid primary key references users(id) on delete cascade,
  gems int not null default 0 check (gems >= 0)
);

-- Todo movimento de gemas, com a resposta guardada para pedidos repetidos (idempotência)
create table ledger (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  delta int not null,
  reason text not null,
  ref text not null,
  result jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref)
);

-- Compras de gemas avisadas pelo RevenueCat (uma linha por transação da loja)
create table purchases (
  transaction_id text primary key,
  user_id uuid references users(id) on delete set null,
  product_id text not null,
  gems int not null,
  refunded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Assinatura do passe: ativa enquanto expires_at estiver no futuro
create table subscriptions (
  user_id uuid primary key references users(id) on delete cascade,
  product_id text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table pass_progress (
  user_id uuid not null references users(id) on delete cascade,
  season text not null,
  xp int not null default 0,
  claimed_free int[] not null default '{}',
  claimed_premium int[] not null default '{}',
  xp_day text not null default '',
  xp_today int not null default 0,
  primary key (user_id, season)
);

-- Eventos do webhook já processados (o RevenueCat pode mandar o mesmo evento de novo)
create table webhook_events (
  id text primary key,
  received_at timestamptz not null default now()
);
