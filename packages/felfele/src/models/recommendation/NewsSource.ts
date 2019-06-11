import exploreDataJSON from '../../../exploreData.json';
import { Feed } from '@felfele/felfele-core';

export type CategoryMap<T> = { [name: string]: SubCategoryMap<T> };
export type SubCategoryMap<T> = { [name: string]: T[] };

export const exploreData = exploreDataJSON as CategoryMap<Feed>;
