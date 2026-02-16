-- AlterTable: Add skill and stat points to Gladiator
-- Adds skillPointsSpent to track total skill points spent (fixes skill points bug)
-- Adds statPointsAvailable to track stat points earned from leveling (3 per level)
-- Note: skillPointsAvailable was added in a previous migration

-- Add skillPointsSpent: tracks total skill points spent across all unlocked skills
ALTER TABLE "Gladiator" ADD COLUMN "skillPointsSpent" INTEGER NOT NULL DEFAULT 0;

-- Add statPointsAvailable: tracks stat points earned from leveling that can be allocated to base stats
ALTER TABLE "Gladiator" ADD COLUMN "statPointsAvailable" INTEGER NOT NULL DEFAULT 0;
