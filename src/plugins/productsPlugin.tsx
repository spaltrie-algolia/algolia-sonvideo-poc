/** @jsxRuntime classic */
/** @jsx h */
import {
  AutocompleteComponents,
  AutocompletePlugin,
  getAlgoliaResults,
} from '@algolia/autocomplete-js';
import { SearchResponse } from '@algolia/client-search';
import { h } from 'preact';
import { useState } from 'preact/hooks';

import { StarIcon, FavoriteIcon } from '../components';
import { ALGOLIA_PRODUCTS_INDEX_NAME } from '../constants';
import { searchClient } from '../searchClient';
import { ProductHit } from '../types';
import { cx } from '../utils';

let segmentPerso = '';

export const productsPlugin: AutocompletePlugin<ProductHit, {}> = {
  setPerso(value) {
    segmentPerso = value;
  },
  getSources({ query }) {
    // if (!query) {
    //   return [];
    // }

    return [
      {
        sourceId: 'productsPlugin',
        getItems({ setContext }) {
          return getAlgoliaResults<ProductHit>({
            searchClient,
            queries: [
              {
                indexName: ALGOLIA_PRODUCTS_INDEX_NAME,
                query,
                params: {
                  hitsPerPage: 8,
                  ruleContexts: segmentPerso ? [segmentPerso] : [],
                  enableRules: true
                },
              },
            ],
            transformResponse({ hits, results }) {
              setContext({
                nbProducts: (results[0] as SearchResponse<ProductHit>).nbHits,
              });

              return hits;
            },
          });
        },
        onSelect({ setIsOpen }) {
          setIsOpen(true);
        },
        templates: {
          header({ state, Fragment }) {
            return (
              <Fragment>
                <div className="aa-SourceHeaderTitle">
                  Products for {state.query}
                </div>
                <div className="aa-SourceHeaderLine" />
              </Fragment>
            );
          },
          item({ item, components }) {
            return <ProductItem hit={item} components={components} />;
          },
          footer({ state }) {
            return (
              state.context.nbProducts > 4 && (
                <div style={{ textAlign: 'center' }}>
                  <a
                    href=""
                    // target="_blank"
                    rel="noreferrer noopener"
                    className="aa-SeeAllBtn"
                  >
                    See All Products ({state.context.nbProducts})
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

function formatPrice(value: number, currency: string) {
  return value.toLocaleString('en-US', { style: 'currency', currency });
}

type ProductItemProps = {
  hit: ProductHit;
  components: AutocompleteComponents;
};

export function ProductItem({ hit, components }: ProductItemProps) {
  const [loaded, setLoaded] = useState(false);
  const [favorite, setFavorite] = useState(false);

  return (
    <a
      href={hit.image_url}
      // target="_blank"
      rel="noreferrer noopener"
      className="aa-ItemLink aa-ProductItem"
    >
      <div className="aa-ItemContent">
        <div
          className={cx('aa-ItemPicture', loaded && 'aa-ItemPicture--loaded')}
        >
          <img
            src={hit.image_url}
            alt={hit.title}
            onLoad={() => setLoaded(true)}
          />
        </div>

        <div className="aa-ItemContentBody">
          <div>
            {hit.brand && (
              <div className="aa-ItemContentBrand">
                <components.Highlight hit={hit} attribute="brand" />
              </div>
            )}
            <div className="aa-ItemContentTitleWrapper">
              <div className="aa-ItemContentTitle">
                <components.Highlight hit={hit} attribute="title" />
              </div>
            </div>
          </div>
          <div>
            <div className="aa-ItemContentPrice">
              <div className="aa-ItemContentPriceCurrent">
                {formatPrice(hit.price, "EUR")}
              </div>
            </div>
            <div className="aa-ItemContentRating">
              <ul>
                {hit.scoreReviews > 0 && Array(5)
                  .fill(null)
                  .map((_, index) => (
                    <li key={index}>
                      <div
                        className={cx(
                          'aa-ItemIcon aa-ItemIcon--noBorder aa-StarIcon',
                          index >= hit.scoreStars && 'aa-StarIcon--muted'
                        )}
                      >
                        <StarIcon />
                      </div>
                    </li>
                  ))}
              </ul>
              <span className="aa-ItemContentRatingReviews">
                {hit.scoreReviews > 0 && (hit.scoreReviews)}
              </span>
            </div>
          </div>
        </div>

        <button
          className="aa-ItemFavorite"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setFavorite((currentFavorite) => !currentFavorite);
          }}
        >
          <div className="aa-ItemIcon aa-ItemIcon--noBorder aa-FavoriteIcon">
            <FavoriteIcon
              className={cx(!favorite && 'aa-FavoriteIcon--outlined')}
            />
          </div>
        </button>
      </div>
    </a>
  );
}
