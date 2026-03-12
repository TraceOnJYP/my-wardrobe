ALTER TABLE "users"
ADD COLUMN "name" VARCHAR(120),
ADD COLUMN "emailVerified" TIMESTAMP(3),
ADD COLUMN "image" VARCHAR(500);

UPDATE "users"
SET
  "name" = COALESCE("name", "displayName"),
  "image" = COALESCE("image", "avatarUrl");

ALTER TABLE "accounts" RENAME COLUMN "refreshToken" TO "refresh_token";
ALTER TABLE "accounts" RENAME COLUMN "accessToken" TO "access_token";
ALTER TABLE "accounts" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "accounts" RENAME COLUMN "tokenType" TO "token_type";
ALTER TABLE "accounts" RENAME COLUMN "idToken" TO "id_token";
ALTER TABLE "accounts" RENAME COLUMN "sessionState" TO "session_state";
