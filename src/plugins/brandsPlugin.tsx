/** @jsxRuntime classic */
/** @jsx h */
import {
  AutocompleteComponents,
  AutocompletePlugin,
  getAlgoliaFacets,
} from '@algolia/autocomplete-js';
import { h } from 'preact';

import { TagIcon } from '../components';
import { ALGOLIA_PRODUCTS_INDEX_NAME } from '../constants';
import { searchClient } from '../searchClient';
import { BrandHit } from '../types';

import {
  setInstantSearchUiState
} from '../app';

function onSelect({ setIsOpen, setQuery, event, query, category }) {
  // You want to trigger the default browser behavior if the event is modified.
  // if (isModifierEvent(event)) {
  //   return;
  // }
  setQuery(''); // reset the query  
  setInstantSearchUiState({
    query: '',
    refinementList: { brand: [category] }
  });

}

export const brandsPlugin: AutocompletePlugin<BrandHit, {}> = {
  getSources({ query }) {
    if (!query) {
      return [];
    }

    return [
      {
        sourceId: 'brandsPlugin',
        getItems() {
          return getAlgoliaFacets({
            searchClient,
            queries: [
              {
                indexName: ALGOLIA_PRODUCTS_INDEX_NAME,
                facet: 'brand',
                params: {
                  facetQuery: query,
                  maxFacetHits: 2,
                },
              },
            ],
          });
        },
        getItemInputValue({ item }) {
          return item.label;
        },
        templates: {
          item({ item, components }) {
            return <BrandItem hit={item} components={components} />;
          },
        },
        onSelect({ setIsOpen, setQuery, item, event }) {
          onSelect({
            setQuery,
            setIsOpen,
            event,
            query: '',
            category: item.label,
          });
        },
      },
    ];
  },

  onSubmit(params) {
    console.log('onSubmit => brandsPlugin ');
  },
};

type BrandItemProps = {
  hit: BrandHit;
  components: AutocompleteComponents;
};

function BrandItem({ hit, components }: BrandItemProps) {
  return (
    <div className="aa-ItemWrapper">
      <div className="aa-ItemContent">
        <div className="aa-ItemIcon aa-ItemIcon--noBorder">
          <TagIcon />
        </div>
        <div className="aa-ItemContentBody">
          <div className="aa-ItemContentTitle">
            <components.ReverseHighlight hit={hit} attribute="label" />
          </div>
        </div>
      </div>
    </div>
  );
}
