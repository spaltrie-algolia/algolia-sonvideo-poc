/** @jsxRuntime classic */
/** @jsx h */
import {
  AutocompleteComponents,
  AutocompletePlugin,
  getAlgoliaFacets,
} from '@algolia/autocomplete-js';
import { h } from 'preact';

import { GridIcon } from '../components';
import { ALGOLIA_PRODUCTS_INDEX_NAME } from '../constants';
import { searchClient } from '../searchClient';
import { CategoryHit } from '../types';
import {
  setInstantSearchUiState
} from '../app';

function onSelect({ setIsOpen, setQuery, event, query, menu }) {
  setQuery(''); // reset the query  
  setInstantSearchUiState({
    query: '',
    hierarchicalMenu: { ['productTypes.lvl0']: menu }
  });
}

export const categoriesPlugin: AutocompletePlugin<CategoryHit, {}> = {
  getSources({ query }) {
    if (!query) {
      return [];
    }

    return [
      {
        sourceId: 'categoriesPlugin',
        getItems() {
          return getAlgoliaFacets({
            searchClient,
            queries: [
              {
                indexName: ALGOLIA_PRODUCTS_INDEX_NAME,
                facet: 'productTypes.lvl2',
                params: {
                  facetQuery: query,
                  maxFacetHits: 6,
                },
              },
            ],
            transformResponse({ facetHits }) {
              let hits = facetHits[0];
              facetHits[0] = hits.sort((a, b) => {
                if (a.label < b.label) return -1;
                return 1;
              });

              return facetHits;

            },
          });
        },
        getItemInputValue({ item }) {
          return item.label;
        },
        templates: {
          item({ item, components }) {
            return <CategoriesItem hit={item} components={components} />;
          },
        },
        onSelect({ setIsOpen, setQuery, item, event }) {
          onSelect({
            setQuery,
            setIsOpen,
            event,
            query: '',
            menu: item.label.split(' > '),
          });
        },

      },
    ];
  },
};

type CategoriesItemProps = {
  hit: CategoryHit;
  components: AutocompleteComponents;
};

function CategoriesItem({ hit, components }: CategoriesItemProps) {
  return (
    <div className="aa-ItemWrapper" style="font-size: 0.9em">
      <div className="aa-ItemContent">
        <div className="aa-ItemIcon aa-ItemIcon--noBorder">
          <GridIcon />
        </div>
        <div className="aa-ItemContentBody">
          <div className="aa-ItemContentTitle" >
            <components.ReverseHighlight hit={hit} attribute="label" />
          </div>
        </div>
      </div>
    </div>
  );
}
