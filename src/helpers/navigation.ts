import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { SubCategory, NewsSource } from '../models/recommendation/NewsSource';
import { LocalFeed } from '../social/api';

export interface Routes {
    App: {};
    Loading: {};
    Welcome: {};
    Post: {};
    Root: {};
    ProfileTab: {};
    PostTab: {};
    FavoriteTab: {};
    SettingsTab: {};
    AllFeedTab: {};
    BugReportView: {};
    SwarmSettingsContainer: {};
    FilterListEditorContainer: {};
    Backup: {};
    Restore: {};
    BackupRestore: {};
    LogViewer: {};
    Debug: {};
    FeedListViewerContainer: {
        showExplore: boolean,
        feeds?: Feed[],
    };
    Feed: {
        feedUrl: string,
        name: string,
    };
    FeedInfo: {
        feed: Feed;
    };
    EditFilter: {
        filter: ContentFilter,
    };
    FeedSettings: {
        feed: LocalFeed,
    };
    FeedFromList: {
        feedUrl: string,
        name: string,
    };
    CategoriesContainer: {

    };
    SubCategoriesContainer: {
        title: string,
        subCategories: SubCategory[],
    };
    NewsSourceFeed: {
        feed: Feed,
    };
    NewsSourceGridContainer: {
        newsSources: NewsSource[],
        subCategoryName: string,
    };
    YourTab: {};
}

export interface TypedNavigation {
    goBack: (routeKey?: string | null) => boolean;
    navigate: <T, K extends keyof T>(routeKey: K, params: T[K]) => boolean;
    pop: (n?: number, params?: { immediate?: boolean }) => boolean;
    getParam: <R, P extends keyof R>(param: P) => R[P];
    setParams: <R>(newParams: R) => boolean;
}
