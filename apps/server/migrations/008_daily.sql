CREATE TABLE daily_progress (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 day text NOT NULL, wins int NOT NULL DEFAULT 0, kills int NOT NULL DEFAULT 0, cards int NOT NULL DEFAULT 0,
 claimed text[] NOT NULL DEFAULT '{}', PRIMARY KEY(user_id,day)
);
CREATE TABLE daily_matches (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 id text NOT NULL, received_at timestamptz NOT NULL, PRIMARY KEY(user_id,id)
);
