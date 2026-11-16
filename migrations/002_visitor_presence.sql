CREATE TABLE IF NOT EXISTS visitor_presence (
    anonymous_session_key VARCHAR(128) PRIMARY KEY,
    last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitor_presence_last_seen
    ON visitor_presence(last_seen_at);
