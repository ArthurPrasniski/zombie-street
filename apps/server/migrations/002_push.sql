-- Notificações remotas (docs/BACKEND.md, GDD seção 20): aparelhos que recebem avisos e a fila
-- de envio. Cada aviso entra uma vez por conta (kind + ref) e o worker manda quando pode.

create table push_tokens (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  -- Fuso do aparelho (IANA), para respeitar a janela do dia (9h às 21h)
  time_zone text not null,
  -- Categorias ligadas em Ajustes: {"progress": true, "pass": true, "shop": true, "news": true}
  prefs jsonb not null,
  updated_at timestamptz not null default now()
);
create index push_tokens_user on push_tokens(user_id);

create table push_outbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  ref text not null,
  title text not null,
  body text not null,
  url text not null,
  -- Urgente: chega a qualquer hora e não conta no limite de 1 por dia (compra confirmada)
  urgent boolean not null default false,
  created_at timestamptz not null,
  sent_at timestamptz,
  -- sent, no-device, opted-out, expired, error
  outcome text,
  unique (user_id, kind, ref)
);
create index push_outbox_pending on push_outbox(id) where sent_at is null;
create index push_outbox_daily on push_outbox(user_id, sent_at) where urgent = false and outcome = 'sent';

-- Avisos para todos (nova temporada, novidades): cada um entra na fila uma vez só
create table push_broadcasts (
  key text primary key,
  created_at timestamptz not null default now()
);
