import * as React from 'react';
import { NavigationRouteConfigMap, createStackNavigator, createBottomTabNavigator, createSwitchNavigator, NavigationScreenProps } from 'react-navigation';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform, YellowBox, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
// @ts-ignore
import { setCustomText } from 'react-native-global-props';

import { SettingsEditorContainer } from './containers/SettingsEditorContainer';
import { Debug } from './Debug';
import { store, persistor } from './reducers';
import { EditFeedContainer as FeedInfoContainer } from './containers/FeedInfoContainer';
import { AllFeedContainer } from './containers/AllFeedContainer';
import { FilterListEditorContainer } from './containers/FilterListEditorContainer';
import { EditFilterContainer } from './containers/EditFilterContainer';
import { YourFeedContainer } from './containers/YourFeedContainer';
import { PostEditorContainer } from './containers/PostEditorContainer';
import { IdentitySettingsContainer } from './containers/IdentitySettingsContainer';
import { DebugScreenContainer } from './containers/DebugScreenContainer';
import { LoadingScreenContainer } from './containers/LoadingScreenContainer';
import { WelcomeContainer } from './containers/WelcomeContainer';
import { appendToLog } from './log';
import { LogViewerContainer } from './containers/LogViewerContainer';
import { Colors, defaultTextProps, ComponentColors } from './styles';
import { FeedContainer } from './containers/FeedContainer';
import { FavoritesContainer } from './containers/FavoritesContainer';
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
import { FavoriteListViewerContainer } from './containers/FavoriteListViewerContainer';
import { initializeNotifications } from './helpers/notifications';
import { OnboardingContainer } from './ui/screens/onboarding/OnboardingContainer';

YellowBox.ignoreWarnings([
    'Method `jumpToIndex` is deprecated.',
    'unknown call: "relay:check"',
]);
Debug.setDebugMode(true);
Debug.addLogger(appendToLog);
setCustomText(defaultTextProps);
initializeNotifications();

const favoriteTabScenes: NavigationRouteConfigMap = {
    FavoriteTab: {
        screen: ({navigation}: NavigationScreenProps) => (
            <FavoritesContainer navigation={navigation}/>
        ),
    },
    Feed: {
        screen: FeedContainer,
    },
    FavoriteListViewerContainer: {
        screen: FavoriteListViewerContainer,
    },
    FeedFromList: {
        screen: SettingsFeedViewContainer,
    },
};
const FavoriteFeedNavigator = createStackNavigator(favoriteTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'FavoriteTab',
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
    FeedInfo: {
        screen: FeedInfoContainer,
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
        FavoriteTab: {
            screen: FavoriteFeedNavigator,
            navigationOptions: {
                tabBarIcon: ({ tintColor, focused }: { tintColor?: string, focused: boolean }) => (
                    <Icon
                        name={'star'}
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
};

const AppNavigator = createStackNavigator(Scenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
    },
);

const WelcomeNavigator = createStackNavigator({
    Welcome: {
        screen: WelcomeContainer,
    },
}, {
    mode: 'card',
    navigationOptions: {
        header: null,
    },
});

const OnboardingNavigator = createStackNavigator({
    Welcome: {
        screen: OnboardingContainer,
    },
}, {
    mode: 'card',
    navigationOptions: {
        header: null,
    },
    initialRouteName: 'Welcome',
});

const InitialNavigator = createSwitchNavigator({
    Loading: OnboardingNavigator,
    App: AppNavigator,
    Welcome: OnboardingNavigator,
}, {
    initialRouteName: 'Loading',
    backBehavior: 'initialRoute',
}
);

export default class App extends React.Component {
    public render() {
        return (
            <TopLevelErrorBoundary>
                <Provider store={store}>
                    <PersistGate loading={null} persistor={persistor}>
                        <InitialNavigator/>
                    </PersistGate>
                </Provider>
            </TopLevelErrorBoundary>
        );
    }
}
