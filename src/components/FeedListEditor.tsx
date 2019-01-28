import * as React from 'react';
import { View, Text, Image, FlatList } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { Feed } from '../models/Feed';
import { Colors, DefaultStyle, IconSize } from '../styles';
import { TouchableView } from './TouchableView';
import { NavigationHeader } from './NavigationHeader';
import { FaviconContainer } from '../containers/FaviconContainer';

export interface DispatchProps {
}

export interface StateProps {
    navigation: any;
    feeds: Feed[];
}

const FAVICON_PADDING_LEFT = 5;
const FAVICON_PADDING_VERTICAL = 16;
const FAVICON_WIDTH = IconSize.LARGE_LIST_ICON + 2 * FAVICON_PADDING_LEFT;
const FAVICON_HEIGHT = IconSize.LARGE_LIST_ICON + 2 * FAVICON_PADDING_VERTICAL;

const FaviconView = (props) => (
    <View style={{
        paddingVertical: FAVICON_PADDING_VERTICAL,
        paddingLeft: FAVICON_PADDING_LEFT,
        width: FAVICON_WIDTH,
        height: FAVICON_HEIGHT,
        margin: 0,
    }}>
        { props.uri != null && props.uri !== '' &&
            <FaviconContainer url={props.uri} />
        }
    </View>
);

const FeedListItem = (props) => (
    <TouchableView
        style={{
            width: '100%',
            flexDirection: 'row',
            backgroundColor: Colors.WHITE,
        }}
        onPress={props.onPress}
    >
        <View>
            <FaviconView uri={props.feed.favicon} />
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

const FeedListItemSeparator = (props) => (
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

export class FeedListEditor extends React.Component<DispatchProps & StateProps> {
    public render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4'}}>
                <NavigationHeader
                    onPressLeftButton={() => {
                        // null is needed otherwise it does not work with switchnavigator backbehavior property
                        this.props.navigation.goBack(null);
                    }}
                    rightButtonText1='Add'
                    onPressRightButton1={this.onAddFeed}
                    title='Feed list'
                />
                <FlatList
                    data={this.props.feeds}
                    renderItem={({item}) => (
                        <FeedListItem
                            feed={item}
                            onPress={() => this.editFeed(item)}
                        />
                    )}
                    ItemSeparatorComponent={FeedListItemSeparator}
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

    private onAddFeed = () => {
        const feed: Feed = {
            favicon: '',
            feedUrl: '',
            name: '',
            url: '',
        };
        this.props.navigation.navigate('FeedInfo', { feed: feed });
    }

    private editFeed = (feed) => {
        this.props.navigation.navigate('FeedInfo', { feed: feed });
    }
}
