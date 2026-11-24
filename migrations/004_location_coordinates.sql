-- Migration 004: Add address and coordinates to location for UC07 & UC35
ALTER TABLE location
    ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7) NULL,
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7) NULL;
