import type { Hit } from "@algolia/client-search";

type ProductRecord = {
  title: string;
  brand: string;
  image_url: string;
  additional_image_link: string[];
  price: number;
  //  reviewScoreBucket: number;
  //  reviewCountCrawl: number;
};

export type ProductHit = Hit<ProductRecord>;
