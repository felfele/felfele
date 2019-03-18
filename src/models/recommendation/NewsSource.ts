export interface NewsSource {
    title: string;
    description: string;
    url: string;
    tags: string[];
}

export interface Category {
    name: string;
    subCategories: SubCategory[];
}

export interface SubCategory {
    name: string;
    list: NewsSource[];
}

import data from '../../../news.json';

type CategoryMap = { [name: string]: SubCategoryMap };
type SubCategoryMap = { [name: string]: NewsSource[] };

export const serializeData = (categoryMap: CategoryMap = data) => {
    const newsSources: Category[] = Object.keys(categoryMap).map((categoryName) => {
        const subCategories = Object.keys(categoryMap[categoryName]).map((subCategoryName) => {
            return {
                name: subCategoryName,
                list: categoryMap[categoryName][subCategoryName],
            };
        });
        return {
            name: categoryName,
            subCategories,
        };
    });
    return newsSources;
};
