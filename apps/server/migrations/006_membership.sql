-- Assinatura mensal independente do passe. Eventos podem chegar fora de ordem.
create table memberships (
  user_id uuid primary key references users(id) on delete cascade,
  expires_at timestamptz not null,
  auto_renew boolean not null,
  period_started_at timestamptz not null,
  last_event_ms bigint not null
);

-- Cada cobrança gera um pacote uma única vez, inclusive com webhooks repetidos.
create table membership_cycles (
  transaction_id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  purchased_at timestamptz not null,
  gems int not null,
  coins int not null,
  refunded boolean not null default false
);
create index membership_cycles_user on membership_cycles(user_id);
