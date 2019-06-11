import {
    ContentFilter,
    LocalFeed,
    Feed,
} from '@felfele/felfele-core';
import { SubCategoryMap } from '../models/recommendation/NewsSource';

export interface Routes {
    App: {};
    Loading: {};
    Onboarding: {};
    ProfileOnboarding: {};
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
    FavoriteListViewerContainer: {
        feeds: Feed[],
    };
    Feed: {
        feedUrl: string,
        name: string,
    };
    FeedInfo: {
        feed: Feed;
    };
    FeedInfoDeepLink: {
        feedUrl: string;
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
        subCategories: SubCategoryMap<Feed>,
    };
    NewsSourceFeed: {
        feed: Feed,
    };
    NewsSourceGridContainer: {
        feeds: Feed[],
        subCategoryName: string,
    };
    YourTab: {};
}

export interface TypedNavigation {
    goBack: <K extends keyof Routes>(routeKey?: K | null) => boolean;
    navigate: <K extends keyof Routes>(routeKey: K, params: Routes[K]) => boolean;
    pop: (n?: number, params?: { immediate?: boolean }) => boolean;
    popToTop: () => void;
    getParam: <K extends keyof Routes, P extends keyof Routes[K]>(param: P) => Routes[K][P];
    setParams: <K extends keyof Routes>(newParams: Routes[K]) => boolean;
}
