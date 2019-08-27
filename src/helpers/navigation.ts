import { ContentFilter } from '../models/ContentFilter';
import { Feed } from '../models/Feed';
import { SubCategoryMap } from '../models/recommendation/NewsSource';
import { LocalFeed, RecentPostFeed } from '../social/api';
import { Contact, MutualContact } from '../models/Contact';
import { ContactFeed } from '../models/ContactFeed';

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
    PrivateChannelTab: {};
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
    PrivateChannelListContainer: {
        contactFeeds: ContactFeed[],
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
    FeedInfoInviteLink: {
        randomSeed: string;
        contactPublicKey: string;
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
    ContactView: {
        publicKey: string;
        feed: Feed;
    };
    ContactInfo: {
        publicKey: string;
    };
}

export interface TypedNavigation {
    goBack: <K extends keyof Routes>(routeKey?: K | null) => boolean;
    navigate: <K extends keyof Routes>(routeKey: K, params: Routes[K]) => boolean;
    pop: (n?: number, params?: { immediate?: boolean }) => boolean;
    popToTop: () => void;
    getParam: <K extends keyof Routes, P extends keyof Routes[K]>(param: P) => Routes[K][P];
    setParams: <K extends keyof Routes>(newParams: Routes[K]) => boolean;
}
