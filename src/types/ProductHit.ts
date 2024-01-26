import type { Hit } from "@algolia/client-search";

type ProductRecord = {
  title: string;
  brand: string;
  image_url: string;
  additional_image_link: string[];
  price: number;
  scoreStars: number;
  scoreReviews: number;
};

export type ProductHit = Hit<ProductRecord>;
