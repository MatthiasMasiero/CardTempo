-- Migration: Add image_url column to credit_cards table
-- Date: 2025-12-27
-- Description: Adds support for storing credit card images/logos

-- Add image_url column to credit_cards table
ALTER TABLE credit_cards
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '/cards/default-card.svg';

-- Add comment to document the column
COMMENT ON COLUMN credit_cards.image_url IS 'URL to the credit card image (brand logo). Defaults to generic card icon.';

-- Update existing rows to have the default image if null
UPDATE credit_cards
SET image_url = '/cards/default-card.svg'
WHERE image_url IS NULL;
