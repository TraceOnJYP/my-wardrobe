export interface CreateWardrobeItemDto {
  clientId?: string;
  itemType: "clothing" | "accessory" | "bag" | "shoes" | "jewelry";
  brand?: string;
  category: string;
  subcategory?: string;
  color?: string;
  designElements?: string;
  material?: string;
  sleeveType?: string;
  collarType?: string;
  fit?: string;
  silhouette?: string;
  style?: string;
  season?: string[];
  scenario?: string;
  size?: string;
  tags?: string[];
  price?: number;
  priceRange?: string;
  wearDays?: number;
  useDays?: number;
  costPerWear?: number;
  purchaseYear?: number;
  purchaseDate?: string;
  purchaseChannel?: string;
  ageYears?: number;
  favoriteScore?: number;
  notes?: string;
  imageUrl?: string;
}

export interface CreateOotdDto {
  clientId?: string;
  wearDate: string;
  scenario?: string;
  notes?: string;
  itemIds: string[];
  imageUrl?: string;
}

export interface RecommendOutfitDto {
  scenario: string;
  style?: string;
  temperatureCelsius?: number;
  locale?: "zh-CN" | "en-US";
}
