CREATE TABLE gameplay_events (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  data jsonb NOT NULL,
  received_at timestamptz NOT NULL
);
CREATE INDEX gameplay_events_retention ON gameplay_events(received_at);
