alter table push_tokens add column language text not null default 'pt' check (language in ('pt', 'en', 'es'));
alter table push_outbox add column localized jsonb not null default '{}';
