import * as React from 'react';

import { StackNavigator, TabNavigator } from 'react-navigation';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { Platform, View, Text } from 'react-native';
import { persistStore, Persistor } from 'redux-persist';
import { Provider } from 'react-redux';

import { Config } from './Config';
import { PostScreen } from './components/PostScreen';
import { YourFeed } from './components/YourFeed';
import { Settings } from './components/Settings';
import { Location } from './components/Location';
import { DebugScreen } from './components/DebugScreen';
import { Share } from './components/Share';
import { Debug } from './Debug';
import { LocalPostManager } from './LocalPostManager';
import { RSSPostManager } from './RSSPostManager';
import { store, persistor } from './reducers';
import { PersistGate } from 'redux-persist/integration/react';
import { FeedListEditorContainer } from './containers/FeedListEditorContainer';
import { EditFeedContainer } from './containers/EditFeedContainer';
import { NewsFeedContainer } from './containers/NewsFeedContainer';
import { FilterListEditorContainer } from './containers/FilterListEditorContainer';
import { EditFilterContainer } from './containers/EditFilterContainer';

Debug.setDebug(__DEV__);

const Root = TabNavigator(
    {
        YourTab: {
            screen: ({navigation}) => (<YourFeed
                                        navigation={navigation}
                                        postManager={LocalPostManager} />),
            path: '/',
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
        NewsTab: {
            screen: ({navigation}) => (<NewsFeedContainer
                                        navigation={navigation}
                                        postManager={RSSPostManager} />),
            path: '/',
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
            screen: ({navigation}) => (<Settings config={Config} error='Error' navigation={navigation} />),
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
                    showLabel: true,
                    style: {
                        backgroundColor: 'black',
                    },
                },
    },
);

const Scenes = {
    Root: {
        screen: Root,
    },
    Post: {
        screen: PostScreen,
    },
    Location: {
        screen: Location,
    },
    Debug: {
        screen: DebugScreen,
    },
    Share: {
        screen: Share,
    },
    FeedListEditorContainer: {
        screen: FeedListEditorContainer,
    },
    FilterListEditorContainer: {
        screen: FilterListEditorContainer,
    },
    EditFeed: {
        screen: EditFeedContainer,
    },
    EditFilter: {
        screen: EditFilterContainer,
    },
};

const AppNavigator = StackNavigator(Scenes,
    {
        mode: 'modal',
        navigationOptions: {
            header: null,
        },
    },
);

export default class App extends React.Component {
    public render() {
        return (
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <AppNavigator />
                </PersistGate>
            </Provider>
        );
    }
}
