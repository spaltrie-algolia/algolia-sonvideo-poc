/** @jsxRuntime classic */
/** @jsx h */
import {
  AutocompleteComponents,
  AutocompletePlugin,
  getAlgoliaFacets,
} from '@algolia/autocomplete-js';
import { h } from 'preact';

import { ALGOLIA_PRODUCTS_INDEX_NAME } from '../constants';
import { searchClient } from '../searchClient';
import { PopularCategoryHit } from '../types';

const baseUrl = 'https://res.cloudinary.com/hilnmyskv/image/upload/v1646067858';
const images = {
  ['Road Bikes']: `img/road_bikes.jpeg`,
  ['Jerseys']: `img/jersey.jpeg`,
  ['Gloves']: `img/gloves.jpg`,
  ['Stems']: `img/stems.jpg`,
  ['Shoes']: `img/shoes.jpeg`,
  ['Helmets']: `img/helmet.jpg`,
};

export const popularCategoriesPlugin: AutocompletePlugin<
  PopularCategoryHit,
  {}
> = {
  getSources() {
    return [
      {
        sourceId: 'popularCategoriesPlugin',
        getItems() {
          return getAlgoliaFacets({
            searchClient,
            queries: [
              {
                indexName: ALGOLIA_PRODUCTS_INDEX_NAME,
                facet: 'productTypes.lvl1',
                params: {
                  facetQuery: '',
                  maxFacetHits: 6,
                },
              },
            ],
          });
        },
        getItemInputValue({ item }) {
          return item.label;
        },
        onSelect({ setIsOpen }) {
          setIsOpen(true);
        },
        templates: {
          header({ Fragment }) {
            return (
              <Fragment>
                <span className="aa-SourceHeaderTitle">Popular categories</span>
                <div className="aa-SourceHeaderLine" />
              </Fragment>
            );
          },
          item({ item, components }) {
            return <CategoryItem hit={item} components={components} />;
          },
        },
      },
    ];
  },
};

type CategoryItemProps = {
  hit: PopularCategoryHit;
  components: AutocompleteComponents;
};

function CategoryItem({ hit }: CategoryItemProps) {
  return (
    <div className="aa-ItemWrapper aa-PopularCategoryItem">
      <div className="aa-ItemContent">
        <div className="aa-ItemPicture" style='height:128px;'>
          <img src={images[hit.label]} alt={hit.label} />
        </div>
        <div className="aa-ItemContentBody">
          <div className="aa-ItemContentTitle">
            {hit.label} <span>({hit.count})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
