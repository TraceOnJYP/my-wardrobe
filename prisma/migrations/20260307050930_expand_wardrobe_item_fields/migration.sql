-- CreateEnum
CREATE TYPE "UserLocale" AS ENUM ('zh_CN', 'en_US');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('active', 'archived');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320),
    "displayName" VARCHAR(120),
    "locale" "UserLocale" NOT NULL DEFAULT 'zh_CN',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wardrobe_items" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clientId" UUID,
    "itemType" VARCHAR(30) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "brand" VARCHAR(120),
    "category" VARCHAR(60) NOT NULL,
    "subcategory" VARCHAR(60),
    "color" VARCHAR(60),
    "designElements" TEXT,
    "material" VARCHAR(120),
    "sleeveType" VARCHAR(60),
    "collarType" VARCHAR(60),
    "fit" VARCHAR(60),
    "silhouette" VARCHAR(60),
    "style" VARCHAR(60),
    "season" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scenario" VARCHAR(80),
    "size" VARCHAR(40),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(12,2),
    "priceRange" VARCHAR(40),
    "wearDays" INTEGER NOT NULL DEFAULT 0,
    "useDays" INTEGER NOT NULL DEFAULT 0,
    "costPerWear" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "purchaseYear" INTEGER,
    "purchaseDate" DATE,
    "purchaseChannel" VARCHAR(120),
    "ageYears" DECIMAL(6,2),
    "favoriteScore" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "wardrobe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ootd_records" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clientId" UUID,
    "wearDate" DATE NOT NULL,
    "scenario" VARCHAR(80),
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ootd_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ootd_items" (
    "id" UUID NOT NULL,
    "ootdRecordId" UUID NOT NULL,
    "wardrobeItemId" UUID NOT NULL,
    "itemOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ootd_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "wardrobe_items_userId_category_idx" ON "wardrobe_items"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "wardrobe_items_userId_clientId_key" ON "wardrobe_items"("userId", "clientId");

-- CreateIndex
CREATE INDEX "ootd_records_userId_wearDate_idx" ON "ootd_records"("userId", "wearDate");

-- CreateIndex
CREATE UNIQUE INDEX "ootd_records_userId_clientId_key" ON "ootd_records"("userId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ootd_items_ootdRecordId_wardrobeItemId_key" ON "ootd_items"("ootdRecordId", "wardrobeItemId");

-- AddForeignKey
ALTER TABLE "wardrobe_items" ADD CONSTRAINT "wardrobe_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ootd_records" ADD CONSTRAINT "ootd_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ootd_items" ADD CONSTRAINT "ootd_items_ootdRecordId_fkey" FOREIGN KEY ("ootdRecordId") REFERENCES "ootd_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ootd_items" ADD CONSTRAINT "ootd_items_wardrobeItemId_fkey" FOREIGN KEY ("wardrobeItemId") REFERENCES "wardrobe_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
