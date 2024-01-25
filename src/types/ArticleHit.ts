import { Hit } from '@algolia/client-search';

type ArticleRecord = {
  title: string;
  blogPostDate: string;
  image: string;
};

export type ArticleHit = Hit<ArticleRecord>;
