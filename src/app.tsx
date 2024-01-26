/** @jsxRuntime classic */
/** @jsx h */
import { autocomplete } from '@algolia/autocomplete-js';
import { h, render } from 'preact';
import { pipe } from 'ramda';

import { createFillWith, uniqBy } from './functions';
import { articlesPlugin } from './plugins/articlesPlugin';
import { brandsPlugin } from './plugins/brandsPlugin';
import { categoriesPlugin } from './plugins/categoriesPlugin';
import { popularCategoriesPlugin } from './plugins/popularCategoriesPlugin';
import { popularPlugin } from './plugins/popularPlugin';
import { productsPlugin } from './plugins/productsPlugin';
import { querySuggestionsPlugin } from './plugins/querySuggestionsPlugin';
// import { quickAccessPlugin } from './plugins/quickAccessPlugin';
import { recentSearchesPlugin } from './plugins/recentSearchesPlugin';
import { cx, hasSourceActiveItem, isDetached } from './utils';

import '@algolia/autocomplete-theme-classic';

import instantsearch from 'instantsearch.js';
import historyRouter from 'instantsearch.js/es/lib/routers/history';
import { simple } from 'instantsearch.js/es/lib/stateMappings';
import { connectSearchBox } from 'instantsearch.js/es/connectors';
import { hierarchicalMenu, hits, pagination, refinementList, rangeSlider, configure, panel, currentRefinements, dynamicWidgets } from 'instantsearch.js/es/widgets';
import { searchClient } from './searchClient';
import { ALGOLIA_PRODUCTS_INDEX_NAME } from './constants';
import { ProductItem } from './plugins/productsPlugin';

const selectElement = document.querySelector("#perso-segment");

selectElement?.addEventListener("change", (event) => {
  console.log(`You like ${event?.target?.value}`);
  setInstantSearchUiState({
    query: '' // Force reset the UI
  });
});


const removeDuplicates = uniqBy(({ source, item }) => {
  const sourceIds = ['recentSearchesPlugin', 'querySuggestionsPlugin'];
  if (sourceIds.indexOf(source.sourceId) === -1) {
    return item;
  }

  return source.sourceId === 'querySuggestionsPlugin' ? item.query : item.label;
});

const fillWith = createFillWith({
  mainSourceId: 'querySuggestionsPlugin',
  limit: isDetached() ? 6 : 10,
});

const combine = pipe(removeDuplicates, fillWith);

const instantSearchRouter = historyRouter();

const search = instantsearch({
  searchClient,
  indexName: ALGOLIA_PRODUCTS_INDEX_NAME,
  //routing: { stateMapping: instantSearchRouter },
  routing: {
    stateMapping: simple(),
  },
});

// Mount a virtual search box to manipulate InstantSearch's `query` UI
// state parameter.
const virtualSearchBox = connectSearchBox(() => { });

const categoriesHierarchicalMenu = panel({
  templates: {
    header: 'Categories',
  },
  hidden(options) {
    return options.results.hierarchicalFacets[0].data === null;
  },
})(hierarchicalMenu);

const brandRefinementList = panel({
  templates: {
    header: 'Brands',
  },
  hidden(options) {
    return options.results.nbHits === 0;
  },
})(refinementList);

const priceRangeSlider = panel({
  templates: {
    header: 'Price Range',
  },
  hidden(options) {
    return options.results.nbHits === 0;
  },
})(rangeSlider);

search.addWidgets([
  virtualSearchBox({}),
  dynamicWidgets({
    container: '#dynamic-widgets',
    widgets: [
      container =>
        brandRefinementList({
          container,
          attribute: 'brand',
          searchable: true,
          showMore: true,
          sortBy: ['isRefined', 'count:desc']
        }),
      container =>
        priceRangeSlider({
          container,
          attribute: 'price',
          precision: -1,
          pips: false
        }),
    ],
    fallbackWidget: ({ container, attribute }) =>
      panel({ templates: { header: attribute } })(
        refinementList
      )({ container, attribute }),
  }),
  currentRefinements({
    container: '#current-refinements',
    transformItems(items) {
      return items.map(item => {
        if (item.label == 'brand') item.label = 'Brand';
        if (item.label == 'productTypes.lvl2') item.label = 'Categories';
        if (item.label == 'price') item.label = 'Price Range';
        return item;
      })
      //return items.filter(item => item.attribute !== 'brand');
    },
  }),
  configure({
    hitsPerPage: 9,
  }),
  hits({
    container: '#hits',
    templates: {
      item(item, { html, components }) {
        return <ProductItem hit={item} components={components} />;
      },
    },
  }),
  pagination({
    container: '#pagination',
  }),
  categoriesHierarchicalMenu({
    container: '#categories',
    attributes: ['productTypes.lvl0', 'productTypes.lvl1', 'productTypes.lvl2'],
  }),
]);



search.start();


// Set the InstantSearch index UI state from external events.
export function setInstantSearchUiState(indexUiState) {

  search.setUiState(uiState => {
    console.log("setUiState: ", new Date());
    if (uiState && uiState[ALGOLIA_PRODUCTS_INDEX_NAME]) {
      search.helper?.state.ruleContexts = []; // reset rule contexts => bug?
      var e = document.getElementById("perso-segment");
      var value = e.options[e.selectedIndex].value;

      uiState[ALGOLIA_PRODUCTS_INDEX_NAME].configure = {
        ...uiState[ALGOLIA_PRODUCTS_INDEX_NAME].configure,
        ruleContexts: [value],
        enableRules: true
      };
      uiState[ALGOLIA_PRODUCTS_INDEX_NAME].query = indexUiState.query;
      productsPlugin.setPerso(value);
      // console.log('hello5: ', uiState[ALGOLIA_PRODUCTS_INDEX_NAME]);
      // console.log('hello5b: ', indexUiState);
      // console.log('hello5c: ', indexUiState);
    }

    return {
      ...uiState,
      [ALGOLIA_PRODUCTS_INDEX_NAME]: {
        ...uiState[ALGOLIA_PRODUCTS_INDEX_NAME],
        // We reset the page when the search state changes.
        page: 1,
        ...indexUiState,
      },
    }
  });
}

// Return the InstantSearch index UI state.
function getInstantSearchUiState() {
  const uiState = instantSearchRouter.read();

  return (uiState && uiState[ALGOLIA_PRODUCTS_INDEX_NAME]) || {};
}

const searchPageState = getInstantSearchUiState();

let skipInstantSearchUiStateUpdate = false;


const { setQuery } = autocomplete({
  container: '#autocomplete',
  placeholder: 'Search products and articles',
  autoFocus: false,
  openOnFocus: true,
  insights: true,
  detachedMediaQuery: 'none',
  initialState: {
    query: searchPageState.query || ''
  },
  onSubmit({ state }) {
    // const options = {
    //   ruleContexts: ['test4'],
    //   enableRules: true
    // }
    setInstantSearchUiState({
      query: state.query //, options
    });
  },
  onReset(context) {
    setInstantSearchUiState({ query: '', hierarchicalMenu: {}, refinementList: [], range: '' });
    console.log('reset state ')
    context.refresh();
  },
  onStateChange({ prevState, state }) {
    // const options = {
    //   ruleContexts: ['test4'],
    //   enableRules: true
    // }
    if (!skipInstantSearchUiStateUpdate && prevState.query !== state.query) {
      setInstantSearchUiState({ query: state.query }); //, options });
    }
    skipInstantSearchUiStateUpdate = false;
  },
  plugins: [
    recentSearchesPlugin,
    querySuggestionsPlugin,
    categoriesPlugin,
    brandsPlugin,
    productsPlugin,
    articlesPlugin,
    popularPlugin,
    //quickAccessPlugin,
    popularCategoriesPlugin,
  ],
  reshape({ sourcesBySourceId, sources, state }) {
    const {
      recentSearchesPlugin: recentSearches,
      querySuggestionsPlugin: querySuggestions,
      categoriesPlugin: categories,
      brandsPlugin: brands,
      popularPlugin: popular,
      popularCategoriesPlugin: popularCategories,
      ...rest
    } = sourcesBySourceId;

    const sourceIdsToExclude = ['popularPlugin', 'popularCategoriesPlugin'];
    const shouldDisplayPopularCategories = sources.every((source) => {
      if (sourceIdsToExclude.indexOf(source.sourceId) !== -1) {
        return true;
      }
      return source.getItems().length === 0;
    });

    return [
      combine(recentSearches, querySuggestions, categories, brands),
      [
        !state.query && popular,
        ...Object.values(rest),
        shouldDisplayPopularCategories && popularCategories,
      ].filter(Boolean),
    ];
  },
  render({ elements, state, Fragment }, root) {
    const {
      recentSearchesPlugin: recentSearches,
      querySuggestionsPlugin: querySuggestions,
      categoriesPlugin: categories,
      brandsPlugin: brands,
      productsPlugin: products,
      articlesPlugin: articles,
      popularPlugin: popular,
      quickAccessPlugin: quickAccess,
      popularCategoriesPlugin: popularCategories,
    } = elements;

    const sourceIdsToExclude = ['popularPlugin', 'popularCategoriesPlugin'];
    const hasResults =
      state.collections
        .filter(
          ({ source }) => sourceIdsToExclude.indexOf(source.sourceId) === -1
        )
        .reduce((prev, curr) => prev + curr.items.length, 0) > 0;

    render(
      <div className="aa-PanelLayout aa-Panel--scrollable">
        {!hasResults && (
          <div className="aa-NoResultsQuery">
            No results for "{state.query}".
          </div>
        )}

        <div className="aa-PanelSections">
          <div className="aa-PanelSection--left">
            {hasResults ? (
              (!state.query && recentSearches && (
                <Fragment>
                  <div className="aa-SourceHeader">
                    <span className="aa-SourceHeaderTitle">
                      Recent searches
                    </span>
                    <div className="aa-SourceHeaderLine" />
                  </div>
                  {recentSearches}
                </Fragment>
              )) ||
              (state.query && (
                <Fragment>
                  <div className="aa-SourceHeader">
                    <span className="aa-SourceHeaderTitle">Suggestions</span>
                    <div className="aa-SourceHeaderLine" />
                  </div>

                  <div className="aa-PanelSectionSources">
                    {recentSearches}
                    {querySuggestions}
                    {categories}
                    {brands}
                  </div>
                </Fragment>
              ))
            ) : (
              <div className="aa-NoResultsAdvices">
                <ul className="aa-NoResultsAdvicesList">
                  <li>Double-check your spelling</li>
                  <li>Use fewer keywords</li>
                  <li>Search for a less specific item</li>
                  <li>Try navigate using on the of the popular categories</li>
                </ul>
              </div>
            )}

            {!state.query && (
              <div className="aa-PanelSection--popular">{popular}</div>
            )}
          </div>
          <div className="aa-PanelSection--right">
            {products && (
              <div className="aa-PanelSection--products">
                <div className="aa-PanelSectionSource">{products}</div>
              </div>
            )}
            {articles && (
              <div className="aa-PanelSection--articles">
                <div className="aa-PanelSectionSource">{articles}</div>
              </div>
            )}

            {quickAccess && (
              <div
                className={cx(
                  'aa-PanelSection--quickAccess aa-PanelSection--zoomable',
                  hasSourceActiveItem('quickAccessPlugin', state) &&
                  'aa-PanelSection--active'
                )}
              >
                {quickAccess}
              </div>
            )}

            {!hasResults && (
              <div
                className={cx(
                  'aa-PanelSection--popularCategories aa-PanelSection--zoomable',
                  hasSourceActiveItem('popularCategoriesPlugin', state) &&
                  'aa-PanelSection--active'
                )}
              >
                {popularCategories}
              </div>
            )}
          </div>
        </div>
      </div>,
      root
    );
  },
});

// This keeps Autocomplete aware of state changes coming from routing
// and updates its query accordingly
window.addEventListener('popstate', () => {
  skipInstantSearchUiStateUpdate = true;
  console.log('addEventListener / popstate')
  setQuery(search.helper?.state.query || '');
  //  console.log('setQuery');
});

setInstantSearchUiState({ query: '' }); // Initial State with rulesContext
