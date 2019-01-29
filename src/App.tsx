import * as React from 'react';
import { NavigationRouteConfigMap, createStackNavigator, createBottomTabNavigator, createSwitchNavigator } from 'react-navigation';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { Platform, YellowBox } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { SettingsEditorContainer } from './containers/SettingsEditorContainer';
import { Debug } from './Debug';
import { RSSPostManager } from './RSSPostManager';
import { store, persistor } from './reducers';
import { FeedListEditorContainer } from './containers/FeedListEditorContainer';
import { EditFeedContainer as FeedInfoContainer } from './containers/FeedInfoContainer';
import { NewsFeedContainer } from './containers/NewsFeedContainer';
import { FilterListEditorContainer } from './containers/FilterListEditorContainer';
import { EditFilterContainer } from './containers/EditFilterContainer';
import { YourFeedContainer } from './containers/YourFeedContainer';
import { EditPostContainer } from './containers/EditPostContainer';
import { IdentitySettingsContainer } from './containers/IdentitySettingsContainer';
import { DebugScreenContainer } from './containers/DebugScreenContainer';
import { LoadingScreenContainer } from './containers/LoadingScreenContainer';
import { WelcomeContainer } from './containers/WelcomeContainer';
import { appendToLog } from './components/LogViewer';
import { LogViewerContainer } from './containers/LogViewerContainer';
import { Colors } from './styles';
import { FeedContainer } from './containers/FeedContainer';
import { FavoritesContainer } from './containers/FavoritesContainer';
import { BackupRestore } from './components/BackupRestore';
import { RestoreContainer } from './containers/RestoreContainer';
import { BackupContainer } from './containers/BackupContainer';
import { SettingsFeedViewContainer } from './containers/SettingsFeedViewContainer';
import { FeedListViewerContainer } from './containers/FeedListViewerContainer';

YellowBox.ignoreWarnings([
    'Method `jumpToIndex` is deprecated.',
    'unknown call: "relay:check"',
]);
Debug.setDebug(true);
Debug.addLogger(appendToLog);

const favoriteTabScenes: NavigationRouteConfigMap = {
    FavoriteTab: {
        screen: ({navigation}) => (<FavoritesContainer
                                    navigation={navigation}
                                />),
    },
    Feed: {
        screen: FeedContainer,
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
    YourTab: {
        screen: ({navigation}) => (<YourFeedContainer
                                    navigation={navigation}
                                />),
    },
    Feed: {
        screen: FeedContainer,
    },
};
const YourFeedNavigator = createStackNavigator(yourTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'YourTab',
    },
);

const newsTabScenes: NavigationRouteConfigMap = {
    NewsTab: {
        screen: ({navigation}) => (<NewsFeedContainer
                                    navigation={navigation}
                                    postManager={RSSPostManager} />),
    },
    FeedListViewerContainer: {
        screen: FeedListViewerContainer,
        mode: 'modal',
    },
    Feed: {
        screen: FeedContainer,
    },
};

const NewsFeedNavigator = createStackNavigator(newsTabScenes,
    {
        mode: 'card',
        navigationOptions: {
            header: null,
        },
        initialRouteName: 'NewsTab',
    },
);

const settingsTabScenes: NavigationRouteConfigMap = {
    SettingsTab: {
        screen: ({navigation}) => (<SettingsEditorContainer navigation={navigation} />),
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
    FeedInfo: {
        screen: FeedInfoContainer,
    },
    IdentitySettingsContainer: {
        screen: IdentitySettingsContainer,
    },
    EditFilter: {
        screen: EditFilterContainer,
    },
    FilterListEditorContainer: {
        screen: FilterListEditorContainer,
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
        YourTab: {
            screen: YourFeedNavigator,
            path: '/your',
            navigationOptions: {
                title: 'Your story',
                tabBarLabel: 'Your story',
                tabBarIcon: ({ tintColor, focused }) => (
                    <MaterialIcon
                        name={focused ? 'rss-feed' : 'rss-feed'}
                        size={20}
                        color={tintColor}
                    />
                ),
            },
        },
        FavoriteTab: {
            screen: FavoriteFeedNavigator,
            path: '/favorites',
            navigationOptions: {
                title: 'Favorites',
                tabBarLabel: 'Your story',
                tabBarIcon: ({ tintColor, focused }) => (
                    <MaterialIcon
                        name={focused ? 'favorite' : 'favorite'}
                        size={20}
                        color={tintColor}
                    />
                ),
            },
        },
        NewsTab: {
            screen: NewsFeedNavigator,
            path: '/news',
            navigationOptions: {
                title: 'New stories',
                tabBarLabel: 'New stories',
                tabBarIcon: ({ tintColor, focused }) => (
                    <FontAwesomeIcon
                        name={focused ? 'newspaper-o' : 'newspaper-o'}
                        size={20}
                        color={tintColor}
                    />
                ),
            },
        },
        SettingsTab: {
            screen: SettingsNavigator,
            path: '/settings',
            navigationOptions: {
                header: undefined,
                title: 'Settings',
                tabBarIcon: ({ tintColor, focused }) => (
                    <MaterialIcon
                        name={focused ? 'settings' : 'settings'}
                        size={20}
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
                        backgroundColor: Colors.BACKGROUND_COLOR,
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
        screen: EditPostContainer,
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
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <InitialNavigator/>
                </PersistGate>
            </Provider>
        );
    }
}
