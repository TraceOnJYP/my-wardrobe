CREATE TYPE "AuthProvider" AS ENUM ('google', 'apple', 'wechat');

ALTER TABLE "users"
ADD COLUMN "avatarUrl" VARCHAR(500),
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE TABLE "accounts" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" VARCHAR(40) NOT NULL,
  "provider" "AuthProvider" NOT NULL,
  "providerAccountId" VARCHAR(191) NOT NULL,
  "refreshToken" TEXT,
  "accessToken" TEXT,
  "expiresAt" INTEGER,
  "tokenType" VARCHAR(40),
  "scope" TEXT,
  "idToken" TEXT,
  "sessionState" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
  "id" UUID NOT NULL,
  "sessionToken" VARCHAR(191) NOT NULL,
  "userId" UUID NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_tokens" (
  "identifier" VARCHAR(191) NOT NULL,
  "token" VARCHAR(191) NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key"
ON "accounts"("provider", "providerAccountId");

CREATE INDEX "accounts_userId_idx"
ON "accounts"("userId");

CREATE UNIQUE INDEX "sessions_sessionToken_key"
ON "sessions"("sessionToken");

CREATE INDEX "sessions_userId_idx"
ON "sessions"("userId");

CREATE UNIQUE INDEX "verification_tokens_token_key"
ON "verification_tokens"("token");

CREATE UNIQUE INDEX "verification_tokens_identifier_token_key"
ON "verification_tokens"("identifier", "token");

ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
