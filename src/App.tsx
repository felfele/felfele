import * as React from 'react';
import { NavigationRouteConfigMap, createStackNavigator, createBottomTabNavigator, createSwitchNavigator, NavigationScreenProps } from 'react-navigation';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform, YellowBox } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
// @ts-ignore
import { setCustomText } from 'react-native-global-props';

import { SettingsEditorContainer } from './containers/SettingsEditorContainer';
import { Debug } from './Debug';
import { store, persistor } from './reducers';
import { FeedListEditorContainer } from './containers/FeedListEditorContainer';
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
import { Colors, defaultTextProps } from './styles';
import { FeedContainer } from './containers/FeedContainer';
import { FavoritesContainer } from './containers/FavoritesContainer';
import { BackupRestore } from './components/BackupRestore';
import { RestoreContainer } from './containers/RestoreContainer';
import { BackupContainer } from './containers/BackupContainer';
import { SettingsFeedViewContainer } from './containers/SettingsFeedViewContainer';
import { FeedListViewerContainer } from './containers/FeedListViewerContainer';
import { SwarmSettingsContainer } from './containers/SwarmSettingsContainer';
import { BugReportView } from './components/BugReportView';
import { TopLevelErrorBoundary } from './components/TopLevelErrorBoundary';
import { FeedSettingsContainer } from './ui/screens/feed-settings/FeedSettingsContainer';
import { CategoriesContainer } from './ui/screens/explore/CategoriesContainer';
import { SubCategoriesContainer } from './ui/screens/explore/SubCategoriesContainer';
import { NewsSourceGridContainer } from './ui/screens/explore/NewsSourceGridContainer';
import { NewsSourceFeedContainer } from './containers/NewSourceFeedContainer';

YellowBox.ignoreWarnings([
    'Method `jumpToIndex` is deprecated.',
    'unknown call: "relay:check"',
]);
Debug.setDebug(true);
Debug.addLogger(appendToLog);
setCustomText(defaultTextProps);

const favoriteTabScenes: NavigationRouteConfigMap = {
    FavoriteTab: {
        screen: ({navigation}: NavigationScreenProps) => (
            <FavoritesContainer navigation={navigation}/>
        ),
    },
    Feed: {
        screen: FeedContainer,
    },
    FeedListViewerContainer: {
        screen: FeedListViewerContainer,
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
    Restore: {
        screen: RestoreContainer,
    },
    Backup: {
        screen: BackupContainer,
    },
    FeedListEditorContainer: {
        screen: FeedListEditorContainer,
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
            <BugReportView navigation={navigation} errorView={false}/>
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
                    <Icon
                        name={'plus-box-outline'}
                        size={24}
                        color={Colors.BRAND_PURPLE}
                    />
                ),
                tabBarOnPress: ({ navigation }: NavigationScreenProps) => {
                    navigation.navigate('Post');
                },
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
                    activeTintColor: 'gray',
                    inactiveTintColor: 'lightgray',
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
                    activeTintColor: 'gray',
                    inactiveTintColor: 'lightgray',
                    style: {
                        opacity: 0.96,
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
    FeedInfo: {
        screen: FeedInfoContainer,
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

const InitialNavigator = createSwitchNavigator({
    Loading: LoadingScreenContainer,
    App: AppNavigator,
    Welcome: WelcomeNavigator,
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
