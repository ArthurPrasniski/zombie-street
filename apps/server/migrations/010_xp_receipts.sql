CREATE TABLE xp_requests (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 id text NOT NULL, PRIMARY KEY(user_id,id)
);
