-- Fila transacional: falhas do Discord não interrompem cadastros nem compras.
create table discord_outbox (
  id bigint generated always as identity primary key,
  ref text not null unique,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  attempts int not null default 0,
  sent_at timestamptz,
  last_error text
);
create index discord_outbox_pending on discord_outbox(available_at, id) where sent_at is null;
