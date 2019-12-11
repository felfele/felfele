import * as React from 'react';
import {
    NavigationRouteConfigMap,
    createStackNavigator,
    createBottomTabNavigator,
    createSwitchNavigator,
    NavigationScreenProps,
} from 'react-navigation';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    Platform,
    YellowBox,
    View,
    AppState,
    AppStateStatus,
} from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
// @ts-ignore
import { setCustomText } from 'react-native-global-props';
// @ts-ignore
import { BottomTabBar } from 'react-navigation-tabs';

import { SettingsEditorContainer } from './containers/SettingsEditorContainer';
import { Debug } from './Debug';
import { EditFeedContainer as FeedInfoContainer, RSSFeedInfoContainer } from './containers/FeedInfoContainer';
import { FilterListEditorContainer } from './containers/FilterListEditorContainer';
import { EditFilterContainer } from './containers/EditFilterContainer';
import { YourFeedContainer } from './containers/YourFeedContainer';
import { PostEditorContainer } from './containers/PostEditorContainer';
import { DebugScreenContainer } from './containers/DebugScreenContainer';
import { LoadingScreenContainer } from './containers/LoadingScreenContainer';
import { appendToLog } from './log';
import { LogViewerContainer } from './containers/LogViewerContainer';
import { defaultTextProps, ComponentColors, DefaultTabBarHeight } from './styles';
import { FeedContainer } from './containers/FeedContainer';
import { BackupRestore } from './components/BackupRestore';
import { RestoreContainer } from './containers/RestoreContainer';
import { BackupContainer } from './containers/BackupContainer';
import { SettingsFeedViewContainer } from './containers/SettingsFeedViewContainer';
import { SwarmSettingsContainer } from './containers/SwarmSettingsContainer';
import { BugReportViewWithTabBar } from './components/BugReportView';
import { TopLevelErrorBoundary } from './components/TopLevelErrorBoundary';
import { FeedSettingsContainer } from './ui/screens/feed-settings/FeedSettingsContainer';
import { CategoriesContainer } from './ui/screens/explore/CategoriesContainer';
import { SubCategoriesContainer } from './ui/screens/explore/SubCategoriesContainer';
import { NewsSourceGridContainer } from './ui/screens/explore/NewsSourceGridContainer';
import { NewsSourceFeedContainer } from './containers/NewSourceFeedContainer';
import { TypedNavigation } from './helpers/navigation';
import { initializeNotifications } from './helpers/notifications';
import { WelcomeContainer } from './ui/screens/onboarding/WelcomeContainer';
import { ContactScreenContainer } from './ui/screens/profile/ContactScreenContainer';
import { HideWhenKeyboardShownComponent } from './ui/misc/HideWhenKeyboardShownComponent';
import { ContactViewContainer } from './ui/screens/contact/ContactViewContainer';
import { BASE_URL } from './helpers/deepLinking';
import { InviteLinkContainer } from './ui/screens/contact/InviteLinkContainer';
import { initStore, getSerializedAppState, getAppStateFromSerialized } from './store';
import { Persistor } from 'redux-persist';
import { Actions } from './actions/Actions';
import { restartApp } from './helpers/restart';
import { felfeleInitAppActions } from './store/felfeleInit';
import { ContactInfoContainer } from './ui/screens/contact/ContactInfoContainer';
import { FELFELE_APP_NAME } from './reducers/defaultData';
import { PrivateChannelsContainer } from './ui/screens/private-channels/PrivateChannelsContainer';
import { PrivateChannelListContainer} from './ui/screens/private-channels/PrivateChannelsListContainer';
import { ShareWithContainer } from './ui/screens/share-with/ShareWithContainer';
import { ContactSuccessContainer } from './ui/screens/contact/ContactSuccessContainer';
import { PublicChannelsContainer } from './ui/screens/public-channels/PublicChannelsContainer';
import { PublicChannelsListContainer } from './ui/screens/public-channels/PublicChannelsListContainer';
import { ContactConfirmContainer } from './ui/screens/contact/ContactConfirmContainer';
import { ContactLoaderContainer } from './ui/screens/contact/ContactLoaderContainer';
import { FeedLinkReaderContainer } from './ui/screens/feed-link-reader/FeedLinkReaderContainer';
import { RSSFeedLoaderContainer } from './ui/screens/rss-feed/RSSFeedLoaderContainer';
import { EditProfileContainer } from './ui/screens/profile/EditProfileContainer';
import { ProfileContainer } from './ui/screens/onboarding/ProfileContainer';
import CustomIcon from './CustomIcon';
import { PagesContainer } from './ui/screens/pages/PagesContainer';
import { CreatePageScreen } from './ui/screens/pages/CreatePageScreen';
import { InviteToPageScreen } from './ui/screens/pages/InviteToPageScreen';
import { CreatePageDoneScreen } from './ui/screens/pages/CreatePageDoneScreen';
import { InviteWithLinkScreen } from './ui/screens/pages/InviteWithLinkScreen';
import { InviteWithQRCodeScreen } from './ui/screens/pages/InviteWithQRCodeScreen';
import { InviteContactScreen } from './ui/screens/pages/InviteContactScreen';

YellowBox.ignoreWarnings([
    'Method `jumpToIndex` is deprecated.',
    'unknown call: "relay:check"',
]);
Debug.setDebugMode(true);
Debug.addLogger(appendToLog);
setCustomText(defaultTextProps);
initializeNotifications();

const privateChannelTabScenes: NavigationRouteConfigMap = {
    PrivateChannelTab: {
        screen: PrivateChannelsContainer,
    },
    Feed: {
        screen: FeedContainer,
    },
    PrivateChannelListContainer: {
        screen: PrivateChannelListContainer,
    },
    ContactView: {
        screen: ContactViewContainer,
    },
    ContactInfo: {
        screen: ContactInfoContainer,
    },
    YourFeed: {
        screen: YourFeedContainer,
    },
};

const PrivateChannelNavigator = createStackNavigator(privateChannelTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'PrivateChannelTab',
    },
);

const profileScenes: NavigationRouteConfigMap = {
    Profile: {
        screen: ContactScreenContainer,
    },
    Feed: {
        screen: FeedContainer,
    },
    FeedSettings: {
        screen: FeedSettingsContainer,
    },
    EditProfileContainer: {
        screen: EditProfileContainer,
    },
};
const ProfileNavigator = createStackNavigator(profileScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'Profile',
    },
);

const publicChannelTabScenes: NavigationRouteConfigMap = {
    PublicChannelTab: {
        screen: PublicChannelsListContainer,
    },
    Feed: {
        screen: FeedContainer,
    },
    PublicChannelsListContainer: {
        screen: PublicChannelsListContainer,
    },
    CategoriesContainer: {
        screen: CategoriesContainer,
    },
    SubCategoriesContainer: {
        screen: SubCategoriesContainer,
    },
    NewsSourceGridContainer: {
        screen: NewsSourceGridContainer,
    },
    NewsSourceFeed: {
        screen: NewsSourceFeedContainer,
    },
    FeedFromList: {
        screen: SettingsFeedViewContainer,
    },
    FeedSettings: {
        screen: FeedSettingsContainer,
    },
};

const PublicChannelNavigator = createStackNavigator(publicChannelTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'PublicChannelTab',
    },
);

const pagesTabScenes: NavigationRouteConfigMap = {
    PagesTab: {
        screen: PagesContainer,
    },
};

const PagesNavigator = createStackNavigator(pagesTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'PagesTab',
    },
);

const settingsTabScenes: NavigationRouteConfigMap = {
    SettingsTab: {
        screen: SettingsEditorContainer,
    },
    Debug: {
        screen: DebugScreenContainer,
    },
    LogViewer: {
        screen: LogViewerContainer,
    },
    BackupRestore: {
        screen: BackupRestore,
    },
    Feed: {
        screen: SettingsFeedViewContainer,
    },
    FeedSettings: {
        screen: FeedSettingsContainer,
    },
    EditFilter: {
        screen: EditFilterContainer,
    },
    FilterListEditorContainer: {
        screen: FilterListEditorContainer,
    },
    SwarmSettingsContainer: {
        screen: SwarmSettingsContainer,
    },
    BugReportView: {
        screen: ({navigation}: NavigationScreenProps) => (
            <BugReportViewWithTabBar navigation={navigation} errorView={false}/>
        ),
    },
};

const SettingsNavigator = createStackNavigator(settingsTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'SettingsTab',
    },
);

const Root = createBottomTabNavigator(
    {
        PublicChannelTab: {
            screen: PagesNavigator,
            navigationOptions: {
                tabBarIcon: ({ tintColor, focused }: { tintColor?: string, focused: boolean }) => (
                    <MaterialCommunityIcon
                        name={'earth'}
                        size={32}
                        color={tintColor}
                    />
                ),
                title: 'Pages',
            },
        },
        SettingsTab: {
            screen: SettingsNavigator,
            navigationOptions: {
                tabBarIcon: ({ tintColor, focused }: { tintColor?: string, focused: boolean }) => (
                    <MaterialCommunityIcon
                        name={'fingerprint'}
                        size={32}
                        color={tintColor}
                    />
                ),
                title: 'Account',
            },
        },
    },
    {
        tabBarPosition: 'bottom',
        animationEnabled: false,
        swipeEnabled: false,
        tabBarOptions: Platform.OS === 'ios'
            ?
                {
                    showLabel: true,
                    activeTintColor: ComponentColors.TAB_ACTIVE_COLOR,
                    inactiveTintColor: ComponentColors.TAB_INACTIVE_COLOR,
                    labelStyle : {
                        fontSize: 12,
                    },
                    style: {
                        opacity: 0.96,
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: DefaultTabBarHeight,
                    },
                }
            :
                {
                    showLabel: true,
                    showIcon: true,
                    activeTintColor: ComponentColors.TAB_ACTIVE_COLOR,
                    inactiveTintColor: ComponentColors.TAB_INACTIVE_COLOR,
                    style: {
                        opacity: 1.0,
                    },
                },
        tabBarComponent: props => <HideWhenKeyboardShownComponent><BottomTabBar {...props}/></HideWhenKeyboardShownComponent>,
    },
);

const Scenes: NavigationRouteConfigMap = {
    Root: {
        screen: Root,
    },
    Post: {
        screen: PostEditorContainer,
    },
    Restore: {
        screen: RestoreContainer,
    },
    Backup: {
        screen: BackupContainer,
    },
    FeedInfo: {
        screen: FeedInfoContainer,
    },
    FeedLinkReader: {
        screen: FeedLinkReaderContainer,
    },
    RSSFeedLoader: {
        screen: RSSFeedLoaderContainer,
    },
    RSSFeedInfo: {
        screen: RSSFeedInfoContainer,
    },
    InviteLink: {
        screen: InviteLinkContainer,
        path: 'invite/:params',
    },
    ContactView: {
        screen: ContactViewContainer,
    },
    ContactConfirm: {
        screen: ContactConfirmContainer,
    },
    ContactLoader: {
        screen: ContactLoaderContainer,
    },
    ContactSuccess: {
        screen: ContactSuccessContainer,
    },
    ShareWithContainer: {
        screen: ShareWithContainer,
    },
    CreatePage: {
        screen: CreatePageScreen,
    },
    InviteToPage: {
        screen: InviteToPageScreen,
    },
    CreatePageDone: {
        screen: CreatePageDoneScreen,
    },
    InviteWithLink: {
        screen: InviteWithLinkScreen,
    },
    InviteWithQRCode: {
        screen: InviteWithQRCodeScreen,
    },
    InviteContact: {
        screen: InviteContactScreen,
    },
};

const AppNavigator = createStackNavigator(Scenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
    },
);

const OnboardingNavigator = createStackNavigator({
    Welcome: {
        screen: WelcomeContainer,
    },
    ProfileOnboarding: {
        screen: ProfileContainer,
    },
}, {
    mode: 'card',
    navigationOptions: {
        header: null,
    },
    initialRouteName: 'Welcome',
});

const LoadingNavigator = createStackNavigator({
    Loading: LoadingScreenContainer,
});

const InitialNavigator = createSwitchNavigator({
    Loading: LoadingNavigator,
    App: () => <AppNavigator uriPrefix={BASE_URL}/>,
    Onboarding: OnboardingNavigator,
}, {
    initialRouteName: 'Loading',
    backBehavior: 'initialRoute',
});

interface FelfeleAppState {
    store: any;
    persistor: Persistor | null;
    nativeAppState: AppStateStatus;
}

export default class FelfeleApp extends React.Component<{}, FelfeleAppState> {
    public state: FelfeleAppState = {
        store: null,
        persistor: null,
        nativeAppState: AppState.currentState,
    };

    public render() {
        if (this.state.store == null) {
            return null;
        }
        return (
            <TopLevelErrorBoundary>
                <Provider store={this.state.store!}>
                    <PersistGate loading={null} persistor={this.state.persistor!}>
                        <InitialNavigator/>
                    </PersistGate>
                </Provider>
            </TopLevelErrorBoundary>
        );
    }

    public async componentDidMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
        const { store, persistor } = await initStore(felfeleInitAppActions);
        this.setState({
            store,
            persistor,
        });
    }

    public componentWillUnmount() {
      AppState.removeEventListener('change', this.handleAppStateChange);
    }

    private handleAppStateChange = async (nextAppState: AppStateStatus) => {
        if (this.state.nativeAppState.match(/inactive|background/) && nextAppState === 'active') {
            Debug.log('App has come to the foreground');
            if (this.state.store != null) {
                const serializedAppState = await getSerializedAppState();
                const appState = await getAppStateFromSerialized(serializedAppState);
                if (appState.lastEditingApp != null && appState.lastEditingApp !== FELFELE_APP_NAME) {
                    this.state.store.dispatch(Actions.updateAppLastEditing(FELFELE_APP_NAME));
                    restartApp();
                }
            }
        }
        this.setState({
            nativeAppState: nextAppState,
        });
    }
}
