import { Feed } from '../../models/Feed';

import exploreDataJSON from '../../../exploreData.json';

export type CategoryMap<T> = { [name: string]: SubCategoryMap<T> };
export type SubCategoryMap<T> = { [name: string]: T[] };

export const exploreData = exploreDataJSON as CategoryMap<Feed>;
