UPDATE "wardrobe_items"
SET
  "purchaseDate" = COALESCE("purchaseDate", ("updatedAt" AT TIME ZONE 'UTC')::DATE),
  "purchaseYear" = COALESCE("purchaseYear", EXTRACT(YEAR FROM "updatedAt" AT TIME ZONE 'UTC')::INTEGER)
WHERE "purchaseDate" IS NULL OR "purchaseYear" IS NULL;
