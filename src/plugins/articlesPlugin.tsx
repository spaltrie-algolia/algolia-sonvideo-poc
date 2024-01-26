/** @jsxRuntime classic */
/** @jsx h */
import {
  AutocompletePlugin,
  getAlgoliaResults,
} from '@algolia/autocomplete-js';
import { SearchResponse } from '@algolia/client-search';
import { h } from 'preact';

import { ALGOLIA_ARTICLES_INDEX_NAME } from '../constants';
import { searchClient } from '../searchClient';
import { ArticleHit } from '../types';

export const articlesPlugin: AutocompletePlugin<ArticleHit, {}> = {
  getSources({ query }) {
    if (!query) {
      return [];
    }

    return [
      {
        sourceId: 'articlesPlugin',
        getItems({ setContext }) {
          return getAlgoliaResults({
            searchClient,
            queries: [
              {
                indexName: ALGOLIA_ARTICLES_INDEX_NAME,
                query,
                params: {
                  hitsPerPage: 2,
                },
              },
            ],
            transformResponse({ hits, results }) {
              setContext({
                nbArticles: (results[0] as SearchResponse<ArticleHit>).nbHits,
              });

              return hits;
            },
          });
        },
        onSelect({ setIsOpen }) {
          setIsOpen(true);
        },
        getItemUrl({ item }) {
          return item.url;
        },
        templates: {
          header({ Fragment }) {
            return (
              <Fragment>
                <span className="aa-SourceHeaderTitle">Articles</span>
                <div className="aa-SourceHeaderLine" />
              </Fragment>
            );
          },
          item({ item }) {
            return <ArticleItem hit={item} />;
          },

          footer({ state }) {
            return (
              state.context.nbArticles > 2 && (
                <div style={{ textAlign: 'center' }}>
                  <a
                    href="https://www.giant-bicycles.com/us/news"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="aa-SeeAllLink"
                  >
                    See All Articles ({state.context.nbArticles})
                  </a>
                </div>
              )
            );
          },
        },
      },
    ];
  },
};

type ArticleItemProps = {
  hit: ArticleHit;
};

function ArticleItem({ hit }: ArticleItemProps) {
  return (
    <a href={hit.url} target="_blank" className="aa-ItemLink aa-ArticleItem">
      <div className="aa-ItemContent">
        <div className="aa-ItemPicture">
          <img src={hit.image} alt={hit.title} />
        </div>

        <div className="aa-ItemContentBody">
          <div className="aa-ItemContentTitle">{hit.title}</div>
          <div className="aa-ItemContentDate">
            Published on{' '}
            {new Date(hit.createdAt).toLocaleDateString('en-GB', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>
    </a>
  );
}
