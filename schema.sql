
BEGIN;


-- ---------------------------------------------------------------------
-- ROLE / USER
-- ---------------------------------------------------------------------
CREATE TABLE role (
    role_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE app_user (
    user_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id        INT          NOT NULL REFERENCES role(role_id),
    username       VARCHAR(100) NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at  TIMESTAMPTZ
);
CREATE INDEX idx_app_user_role ON app_user(role_id);

-- ---------------------------------------------------------------------
-- LANGUAGE
-- ---------------------------------------------------------------------
CREATE TABLE language (
    language_code  VARCHAR(10)  PRIMARY KEY,           -- vd: en, vi, ja, fr-CA
    language_name  VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    is_fallback    BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Dòng fallback phải là English
    CONSTRAINT chk_language_fallback_is_english
        CHECK (is_fallback = FALSE OR language_code = 'en')
);

CREATE UNIQUE INDEX uq_language_single_fallback
    ON language (is_fallback) WHERE is_fallback;

-- ---------------------------------------------------------------------
-- LOCATION
-- ---------------------------------------------------------------------
CREATE TABLE location (
    location_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE location_translation (
    location_id        BIGINT       NOT NULL REFERENCES location(location_id) ON DELETE CASCADE,
    language_code      VARCHAR(10)  NOT NULL REFERENCES language(language_code),
    name               VARCHAR(255) NOT NULL,
    short_description  TEXT,
    PRIMARY KEY (location_id, language_code)
);

CREATE TABLE user_location_assignment (
    user_id      BIGINT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    location_id  BIGINT NOT NULL REFERENCES location(location_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, location_id)
);
CREATE INDEX idx_ula_location ON user_location_assignment(location_id);

-- ---------------------------------------------------------------------
-- POI
-- ---------------------------------------------------------------------
CREATE TABLE poi (
    poi_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    location_id  BIGINT  NOT NULL REFERENCES location(location_id),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_poi_location ON poi(location_id);

CREATE TABLE poi_translation (
    poi_id             BIGINT       NOT NULL REFERENCES poi(poi_id) ON DELETE CASCADE,
    language_code      VARCHAR(10)  NOT NULL REFERENCES language(language_code),
    name               VARCHAR(255) NOT NULL,
    short_description  TEXT,
    PRIMARY KEY (poi_id, language_code)
);

-- ---------------------------------------------------------------------
-- VOICE
-- ---------------------------------------------------------------------
CREATE TABLE voice (
    voice_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    language_code      VARCHAR(10)  NOT NULL REFERENCES language(language_code),
    provider_voice_key VARCHAR(255) NOT NULL,
    is_available       BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_voice_lang_key UNIQUE (language_code, provider_voice_key),
    -- phục vụ composite FK bên dưới (đảm bảo voice đúng ngôn ngữ)
    CONSTRAINT uq_voice_id_lang UNIQUE (voice_id, language_code)
);

CREATE TABLE language_default_voice (
    language_code  VARCHAR(10) PRIMARY KEY REFERENCES language(language_code),
    voice_id       BIGINT      NOT NULL,
    -- Voice mặc định phải thuộc đúng ngôn ngữ đó
    CONSTRAINT fk_ldv_voice_same_lang
        FOREIGN KEY (voice_id, language_code)
        REFERENCES voice(voice_id, language_code)
);

-- ---------------------------------------------------------------------
-- NARRATION_CONTENT / CONTENT_VERSION
-- ---------------------------------------------------------------------
CREATE TABLE narration_content (
    content_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id         BIGINT      NOT NULL REFERENCES poi(poi_id) ON DELETE CASCADE,
    language_code  VARCHAR(10) NOT NULL REFERENCES language(language_code),
    needs_review   BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_narration_poi_lang UNIQUE (poi_id, language_code)
);

CREATE TABLE content_version (
    version_id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content_id                     BIGINT       NOT NULL REFERENCES narration_content(content_id) ON DELETE CASCADE,
    version_number                 INT          NOT NULL CHECK (version_number > 0),
    title                          VARCHAR(255) NOT NULL,
    narration_text                 TEXT         NOT NULL,

    status                         VARCHAR(30)  NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','PUBLISHED','UNPUBLISHED')),
    translation_source_version_id  BIGINT REFERENCES content_version(version_id),
    selected_voice_id              BIGINT REFERENCES voice(voice_id),
    created_at                     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_content_version UNIQUE (content_id, version_number),
    CONSTRAINT chk_not_self_translation
        CHECK (translation_source_version_id IS NULL OR translation_source_version_id <> version_id)
);
CREATE INDEX idx_cv_content ON content_version(content_id);
CREATE INDEX idx_cv_status ON content_version(status);
CREATE INDEX idx_cv_translation_source ON content_version(translation_source_version_id);
CREATE INDEX idx_cv_selected_voice ON content_version(selected_voice_id);

-- ---------------------------------------------------------------------
-- AUDIO (1 version có tối đa 1 audio)
-- ---------------------------------------------------------------------
CREATE TABLE audio (
    audio_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version_id   BIGINT       NOT NULL UNIQUE REFERENCES content_version(version_id) ON DELETE CASCADE,
    source_type  VARCHAR(10)  NOT NULL CHECK (source_type IN ('TTS','UPLOAD')),
    voice_id     BIGINT REFERENCES voice(voice_id),
    file_path    VARCHAR(1000) NOT NULL,
    file_format  VARCHAR(20)  NOT NULL,
    file_size    BIGINT       NOT NULL CHECK (file_size >= 0),
    is_valid     BOOLEAN      NOT NULL DEFAULT TRUE,
    is_outdated  BOOLEAN      NOT NULL DEFAULT FALSE,
    -- voice_id chỉ có khi TTS
    CONSTRAINT chk_audio_voice_only_tts
        CHECK ((source_type = 'TTS'    AND voice_id IS NOT NULL)
            OR (source_type = 'UPLOAD' AND voice_id IS NULL))
);
CREATE INDEX idx_audio_voice ON audio(voice_id);

-- ---------------------------------------------------------------------
-- REVIEW_HISTORY
-- ---------------------------------------------------------------------
CREATE TABLE review_history (
    review_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version_id     BIGINT      NOT NULL REFERENCES content_version(version_id) ON DELETE CASCADE,
    actor_user_id  BIGINT      NOT NULL REFERENCES app_user(user_id),
    event_type     VARCHAR(20) NOT NULL
        CHECK (event_type IN ('SUBMIT','WITHDRAW','APPROVE','REJECT','PUBLISH','UNPUBLISH','REPUBLISH')),
    reason         TEXT,
    acted_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_version ON review_history(version_id, acted_at);
CREATE INDEX idx_review_actor ON review_history(actor_user_id);

-- ---------------------------------------------------------------------
-- QR_CODE (1 POI có tối đa 1 QR)
-- ---------------------------------------------------------------------
CREATE TABLE qr_code (
    qr_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id      BIGINT        NOT NULL UNIQUE REFERENCES poi(poi_id) ON DELETE CASCADE,
    target_url  VARCHAR(2000) NOT NULL,
    image_path  VARCHAR(1000),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ACTIVITY_EVENT
-- ---------------------------------------------------------------------
CREATE TABLE activity_event (
    event_id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type             VARCHAR(30) NOT NULL
        CHECK (event_type IN ('PAGE_VIEW','QR_OPEN','AUDIO_START','AUDIO_PLAY_DURATION')),
    occurred_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    poi_id                 BIGINT      REFERENCES poi(poi_id) ON DELETE SET NULL,
    location_id            BIGINT      REFERENCES location(location_id) ON DELETE SET NULL,
    language_code          VARCHAR(10) REFERENCES language(language_code),
    qr_id                  BIGINT      REFERENCES qr_code(qr_id) ON DELETE SET NULL,
    duration_ms            INT         CHECK (duration_ms IS NULL OR duration_ms >= 0),
    anonymous_session_key  VARCHAR(128),
    CONSTRAINT chk_duration_only_for_play
        CHECK (duration_ms IS NULL OR event_type = 'AUDIO_PLAY_DURATION')
);
CREATE INDEX idx_ae_occurred_at ON activity_event(occurred_at);
CREATE INDEX idx_ae_poi ON activity_event(poi_id, occurred_at);
CREATE INDEX idx_ae_location ON activity_event(location_id, occurred_at);
CREATE INDEX idx_ae_type ON activity_event(event_type, occurred_at);
CREATE INDEX idx_ae_qr ON activity_event(qr_id);

-- ---------------------------------------------------------------------
-- Dữ liệu khởi tạo (tùy chọn)
-- ---------------------------------------------------------------------
INSERT INTO language (language_code, language_name, is_active, is_fallback) VALUES
    ('en', 'English',    TRUE, TRUE),
    ('vi', 'Tiếng Việt', TRUE, FALSE);

INSERT INTO role (role_name) VALUES ('ADMIN'), ('CONTENT_MANAGER')
ON CONFLICT (role_name) DO NOTHING;

COMMIT;