import { AutocompleteHit } from './AutocompleteHit';

type CategoryRecord = {
  label: string;
  count: number;
};

export type CategoryHit = AutocompleteHit<CategoryRecord>;
