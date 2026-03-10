import type { RecommendOutfitDto } from "@/types/dto";

export const aiService = {
  async recommend(input: RecommendOutfitDto) {
    return {
      outfits: [
        {
          itemIds: ["11111111-1111-1111-1111-111111111111"],
          reason: `Recommended for ${input.scenario}`,
        },
      ],
    };
  },
};
