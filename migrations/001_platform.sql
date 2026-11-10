CREATE TABLE IF NOT EXISTS auth_session (
    session_id       UUID PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    expires_at       TIMESTAMPTZ NOT NULL,
    revoked_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_session_user ON auth_session(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_session_expiry ON auth_session(expires_at);

CREATE TABLE IF NOT EXISTS password_reset_token (
    token_id    UUID PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_token(user_id);

CREATE TABLE IF NOT EXISTS integration_outbox (
    event_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aggregate_type VARCHAR(80) NOT NULL,
    aggregate_id BIGINT NOT NULL,
    event_type   VARCHAR(80) NOT NULL,
    payload      JSONB NOT NULL,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished ON integration_outbox(published_at, occurred_at);

CREATE TABLE IF NOT EXISTS analytics_ingestion (
    event_id      UUID PRIMARY KEY,
    received_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
