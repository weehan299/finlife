-- AlterTable: add dateOfBirth as nullable
ALTER TABLE "User" ADD COLUMN "dateOfBirth" TIMESTAMP(3);

-- Backfill existing rows with random dates between 1985-01-01 and 1995-12-31
UPDATE "User"
SET "dateOfBirth" = '1985-01-01'::timestamp
  + (random() * ('1995-12-31'::timestamp - '1985-01-01'::timestamp));
