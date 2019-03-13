export interface NewsSource {
    title: string;
    description: string;
    url: string;
    tags: string[];
}

export interface Category {
    list: { [name: string]: SubCategory };
}

export interface SubCategory {
    name: string;
    list: NewsSource[];
}

import data from '../../../news.json';

export const serializeData = () => {
    const categoryMap: { [name: string]: Category } = data;
    return categoryMap;
};
