import * as React from 'react';
import { View, Text, Button, Image, FlatList } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { Feed } from '../models/Feed';
import { Colors, DefaultStyle, IconSize } from '../styles';
import { TouchableView } from './TouchableView';

interface FeedListEditorNavigationActions {
    back?: () => void;
    add?: () => void;
}

const navigationActions: FeedListEditorNavigationActions = {
    back: undefined,
    add: undefined,
};

export interface DispatchProps {

}

export interface StateProps {
    navigation: any;
    feeds: Feed[];
}

const FAVICON_PADDING_LEFT = 5;
const FAVICON_PADDING_VERTICAL = 20;
const FAVICON_WIDTH = IconSize.LARGE_LIST_ICON + 2 * FAVICON_PADDING_LEFT;
const FAVICON_HEIGHT = IconSize.LARGE_LIST_ICON + 2 * FAVICON_PADDING_VERTICAL;

const Favicon = (props) => (
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
    public static navigationOptions = {
        header: undefined,
        title: 'Feed list',
        headerLeft: <Button title='Back' onPress={() => navigationActions.back!()} />,
        headerRight: <Button title='Add' onPress={() => navigationActions.add!()} />,
    };

    constructor(props) {
        super(props);
        navigationActions.back = this.props.navigation.goBack;
        navigationActions.add = this.onAddFeed.bind(this);
    }

    public render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
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

    private onAddFeed() {
        const feed: Feed = {
            favicon: '',
            feedUrl: '',
            name: '',
            url: '',
        };
        this.props.navigation.navigate('EditFeed', { feed: feed });
    }

    private editFeed = (feed) => {
        this.props.navigation.navigate('EditFeed', { feed: feed });
    }
}
