import * as React from 'react';

import { StackNavigator, TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { View, StatusBar, Platform } from 'react-native';

import { Config } from './Config';
import { PostScreen } from './components/PostScreen';
import { YourFeed } from './components/YourFeed';
import { Settings } from './components/Settings';
import { Location } from './components/Location';
import { DebugScreen } from './components/DebugScreen';
import { Share } from './components/Share';
import { FeedListEditor } from './components/FeedListEditor';
import { EditFeed } from './components/EditFeed';
import { Debug } from './Debug';
import { LocalPostManager } from './LocalPostManager';
import { RSSPostManager } from './RSSPostManager';

Debug.setDebug(__DEV__);

const NavigationHeaderComponent = Platform.OS === 'ios'
            ? null
            : <StatusBar hidden={true} barStyle='light-content' backgroundColor='blue' />;

const TabBarOptions = Platform.OS === 'ios'
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
        }
    ;

const Root = TabNavigator(
    {
        YourTab: {
            screen: ({navigation}) => (<YourFeed
                                        uri={Config.baseUri}
                                        post='Post'
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
            screen: ({navigation}) => (<YourFeed
                                        uri={Config.baseUri}
                                        post='Post'
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
    }
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
    FeedListEditor: {
        screen: FeedListEditor,
    },
    EditFeed: {
        screen: EditFeed,
    },
};

const AppNavigator = StackNavigator(Scenes,
    {
        mode: 'modal',
        navigationOptions: {
            header: null,
        },
    }
);

export default class App extends React.Component {
    public render() {
        return (
            <AppNavigator />
        );
    }
}
