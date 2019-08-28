import * as React from 'react';
import {
    NavigationRouteConfigMap,
    createStackNavigator,
    createBottomTabNavigator,
    createSwitchNavigator,
    NavigationScreenProps,
} from 'react-navigation';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    Platform,
    YellowBox,
    View,
    AppState,
    AppStateStatus,
    Image,
} from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
// @ts-ignore
import { setCustomText } from 'react-native-global-props';

import { SettingsEditorContainer } from './containers/SettingsEditorContainer';
import { Debug } from './Debug';
import { EditFeedContainer as FeedInfoContainer, RSSFeedInfoContainer } from './containers/FeedInfoContainer';
import { AllFeedContainer } from './containers/AllFeedContainer';
import { FilterListEditorContainer } from './containers/FilterListEditorContainer';
import { EditFilterContainer } from './containers/EditFilterContainer';
import { YourFeedContainer } from './containers/YourFeedContainer';
import { PostEditorContainer } from './containers/PostEditorContainer';
import { IdentitySettingsContainer } from './containers/IdentitySettingsContainer';
import { DebugScreenContainer } from './containers/DebugScreenContainer';
import { LoadingScreenContainer } from './containers/LoadingScreenContainer';
import { appendToLog } from './log';
import { LogViewerContainer } from './containers/LogViewerContainer';
import { defaultTextProps, ComponentColors } from './styles';
import { FeedContainer } from './containers/FeedContainer';
import { BackupRestore } from './components/BackupRestore';
import { RestoreContainer } from './containers/RestoreContainer';
import { BackupContainer } from './containers/BackupContainer';
import { SettingsFeedViewContainer } from './containers/SettingsFeedViewContainer';
import { FeedListViewerContainer } from './containers/FeedListViewerContainer';
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
import { ProfileContainer } from './ui/screens/onboarding/ProfileContainer';
import { HideWhenKeyboardShownComponent } from './ui/misc/HideWhenKeyboardShownComponent';
import { ContactViewContainer } from './ui/screens/contact/ContactViewContainer';
// @ts-ignore
import { BottomTabBar } from 'react-navigation-tabs';
import { FeedInfoFollowLinkContainer } from './containers/FeedInfoFollowLinkContainer';
import { BASE_URL } from './helpers/deepLinking';
import { FeedInfoInviteLinkContainer } from './containers/FeedInfoInviteLinkContainer';
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
        screen: ({navigation}: NavigationScreenProps) => (
            <PrivateChannelsContainer navigation={navigation}/>
        ),
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

const yourTabScenes: NavigationRouteConfigMap = {
    Profile: {
        screen: IdentitySettingsContainer,
    },
    YourTab: {
        screen: ({navigation}: NavigationScreenProps) => (
            <YourFeedContainer navigation={navigation}/>
        ),
    },
    Feed: {
        screen: FeedContainer,
    },
    FeedSettings: {
        screen: FeedSettingsContainer,
    },
};
const ProfileNavigator = createStackNavigator(yourTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'Profile',
    },
);

const allFeedTabScenes: NavigationRouteConfigMap = {
    AllFeed: {
        screen: ({navigation}: NavigationScreenProps) => (
            <AllFeedContainer
                navigation={navigation}
            />
        ),
    },
    Feed: {
        screen: FeedContainer,
    },
    FeedListViewerContainer: {
        screen: FeedListViewerContainer,
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

const AllFeedNavigator = createStackNavigator(allFeedTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'AllFeed',
    },
);

const settingsTabScenes: NavigationRouteConfigMap = {
    SettingsTab: {
        screen: ({navigation}: NavigationScreenProps) => (
            <SettingsEditorContainer navigation={navigation} />
        ),
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
        AllFeedTab: {
            screen: AllFeedNavigator,
            navigationOptions: {
                tabBarIcon: ({ tintColor, focused }: { tintColor?: string, focused: boolean }) => (
                    <Icon
                        name={'home'}
                        size={24}
                        color={tintColor}
                    />
                ),
            },
        },
        PrivateChannelTab: {
            screen: PrivateChannelNavigator,
            navigationOptions: {
                tabBarIcon: ({ tintColor, focused }: { tintColor?: string, focused: boolean }) => (
                    <Icon
                        name={'account-multiple'}
                        size={24}
                        color={tintColor}
                    />
                ),
            },
        },
        PostTab: {
            screen: PostEditorContainer,
            navigationOptions: {
                tabBarIcon: ({ tintColor, focused }: { tintColor?: string, focused: boolean }) => (
                    <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: ComponentColors.TAB_ACTION_BUTTON_COLOR,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Icon
                            name={'pencil'}
                            size={24}
                            color={ComponentColors.TAB_ACTION_BUTTON_ICON_COLOR}
                        />
                    </View>
                ),
                tabBarOnPress: ({ navigation }: { navigation: TypedNavigation }) => {
                    navigation.navigate('Post', {});
                },
                tabBarTestID: 'TabBarPostButton',
            },
        },
        ProfileTab: {
            screen: ProfileNavigator,
            navigationOptions: {
                tabBarIcon: ({ tintColor, focused }: { tintColor?: string, focused: boolean }) => (
                    <Icon
                        name={'account'}
                        size={24}
                        color={tintColor}
                    />
                ),
            },
        },
        SettingsTab: {
            screen: SettingsNavigator,
            navigationOptions: {
                tabBarIcon: ({ tintColor, focused }: { tintColor?: string, focused: boolean }) => (
                    <MaterialIcon
                        name={'settings'}
                        size={24}
                        color={tintColor}
                    />
                ),
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
                    showLabel: false,
                    activeTintColor: ComponentColors.TAB_ACTIVE_COLOR,
                    inactiveTintColor: ComponentColors.TAB_INACTIVE_COLOR,
                    style: {
                        opacity: 0.96,
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                    },
                }
            :
                {
                    showLabel: false,
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
    RSSFeedInfo: {
        screen: RSSFeedInfoContainer,
    },
    FeedInfoDeepLink: {
        screen: FeedInfoFollowLinkContainer,
        path: 'follow/:feedUrl',
    },
    FeedInfoInviteLink: {
        screen: FeedInfoInviteLinkContainer,
        path: 'invite/:randomSeed/:contactPublicKey',
    },
    ContactView: {
        screen: ContactViewContainer,
    },
    ContactInfo: {
        screen: ContactInfoContainer,
    },
    ShareWithContainer: {
        screen: ShareWithContainer,
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
    App: () => <AppNavigator uriPrefix={BASE_URL} />,
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
