import * as React from 'react';
import { View, Text, Image, FlatList } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { Feed } from '../models/Feed';
import { Colors, DefaultStyle, IconSize, DefaultTabBarHeight } from '../styles';
import { TouchableView } from './TouchableView';
import { NavigationHeader } from './NavigationHeader';
import { Props as NavHeaderProps } from './NavigationHeader';

export interface DispatchProps {
}

export interface StateProps {
    navigation: any;
    feeds: Feed[];
    onPressFeed: (navigation: any, feed: Feed) => void;
}

const FAVICON_PADDING_LEFT = 5;
const FAVICON_PADDING_VERTICAL = 20;
const FAVICON_WIDTH = IconSize.LARGE_LIST_ICON + 2 * FAVICON_PADDING_LEFT;
const FAVICON_HEIGHT = IconSize.LARGE_LIST_ICON + 2 * FAVICON_PADDING_VERTICAL;

const Favicon = (props: { uri: string }) => (
    <View style={{
        paddingVertical: FAVICON_PADDING_VERTICAL,
        paddingLeft: FAVICON_PADDING_LEFT,
        width: FAVICON_WIDTH,
        height: FAVICON_HEIGHT,
        margin: 0,
    }}>
        { props.uri != null && props.uri !== '' &&
            <Image
                source={{
                    uri: props.uri,
                    width: IconSize.LARGE_LIST_ICON,
                    height: IconSize.LARGE_LIST_ICON,
                }}
                style={DefaultStyle.favicon}
            />
        }
    </View>
);

const FeedListItem = (props: { feed: Feed, onPress: () => void }) => (
    <TouchableView
        style={{
            width: '100%',
            flexDirection: 'row',
            backgroundColor: Colors.WHITE,
        }}
        onPress={props.onPress}
    >
        <View>
            <Favicon uri={props.feed.favicon} />
        </View>
        {props.feed.favorite === true &&
            <View style={{
                alignItems: 'center',
                flexDirection: 'row',
                paddingLeft: 5,
            }}>
                <MaterialIcon name='favorite' color={Colors.LIGHT_GRAY} size={20} />
            </View>
        }
        <View
            style={{
                justifyContent: 'center',
                paddingLeft: 10,
            }}
        >
            <Text
                numberOfLines={1}
                ellipsizeMode='tail'
                style={{
                    fontSize: 16,
                    color: props.feed.followed === true ? Colors.DARK_GRAY : Colors.GRAY,
                }}
            >{props.feed.name}</Text>
        </View>
    </TouchableView>
);

const FeedListItemSeparator = (props: {}) => (
    <View
        style={{
            width: '100%',
            height: 1,
            maxHeight: 1,
            flexDirection: 'row',
            backgroundColor: Colors.LIGHTER_GRAY,
            marginLeft: IconSize.LARGE_LIST_ICON + FAVICON_PADDING_LEFT * 3,
            padding: 0,
        }}
    >
    </View>
);

const FeedListFooter = (props: {}) => (
    <View style={{
        paddingBottom: DefaultTabBarHeight,
        backgroundColor: Colors.LIGHTER_GRAY,
    }} />
);

export class FeedList extends React.PureComponent<DispatchProps & StateProps & { children?: React.ReactElement<NavHeaderProps>}> {
    public render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                {this.props.children}
                <FlatList
                    data={this.props.feeds}
                    renderItem={({item}) => (
                        <FeedListItem
                            feed={item}
                            onPress={() => {
                                this.props.onPressFeed(this.props.navigation, item);
                            }}
                        />
                    )}
                    ItemSeparatorComponent={FeedListItemSeparator}
                    ListFooterComponent={FeedListFooter}
                    keyExtractor={(item) => item.feedUrl}
                    style={{
                        backgroundColor: Colors.LIGHTER_GRAY,
                    }}
                    contentContainerStyle={{
                        backgroundColor: Colors.WHITE,
                    }}
                />
            </View>
        );
    }
}

export class FeedListEditor extends React.PureComponent<DispatchProps & StateProps> {
    public render() {
        return (
            <FeedList {...this.props}>
                <NavigationHeader
                    onPressLeftButton={() => {
                        // null is needed otherwise it does not work with switchnavigator backbehavior property
                        this.props.navigation.goBack(null);
                    }}
                    rightButtonText1='Add'
                    onPressRightButton1={this.onAddFeed}
                    title='Feed list'
                />
            </FeedList>
        );
    }

    private onAddFeed = () => {
        const feed: Feed = {
            favicon: '',
            feedUrl: '',
            name: '',
            url: '',
        };
        this.props.navigation.navigate('FeedInfo', { feed: feed });
    }
}

export class FeedListViewer extends React.PureComponent<DispatchProps & StateProps> {
    public render() {
        return (
            <FeedList {...this.props}>
                <NavigationHeader
                    onPressLeftButton={() => {
                        this.props.navigation.goBack();
                    }}
                    title='All feeds'
                />
            </FeedList>
        );
    }
}
