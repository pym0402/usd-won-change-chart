ALTER TABLE "users"
  ADD COLUMN "passwordVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "temporaryPasswordHash" TEXT,
  ADD COLUMN "temporaryPasswordExpiresAt" TIMESTAMP(3);
