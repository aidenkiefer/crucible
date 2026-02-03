-- AlterTable: Update Gladiator stats from 4 to 8
-- Old stats: strength, agility, endurance, technique
-- New stats: constitution, strength, dexterity, speed, defense, magicResist, arcana, faith

-- Step 1: Add new stat columns with default value 50
ALTER TABLE "Gladiator" ADD COLUMN "constitution" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Gladiator" ADD COLUMN "dexterity" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Gladiator" ADD COLUMN "speed" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Gladiator" ADD COLUMN "defense" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Gladiator" ADD COLUMN "magicResist" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Gladiator" ADD COLUMN "arcana" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Gladiator" ADD COLUMN "faith" INTEGER NOT NULL DEFAULT 50;

-- Step 2: Migrate data from old stats to new stats (optional - can preserve old values)
-- Map: agility -> dexterity, endurance -> constitution, technique -> speed
UPDATE "Gladiator" SET "dexterity" = "agility";
UPDATE "Gladiator" SET "constitution" = "endurance";
UPDATE "Gladiator" SET "speed" = "technique";

-- Step 3: Drop old stat columns
ALTER TABLE "Gladiator" DROP COLUMN "agility";
ALTER TABLE "Gladiator" DROP COLUMN "endurance";
ALTER TABLE "Gladiator" DROP COLUMN "technique";
