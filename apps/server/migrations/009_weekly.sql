CREATE TABLE weekly_attempts (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 week text NOT NULL, config jsonb NOT NULL, started_at timestamptz NOT NULL, result jsonb
);
CREATE INDEX weekly_user_week ON weekly_attempts(user_id,week);
