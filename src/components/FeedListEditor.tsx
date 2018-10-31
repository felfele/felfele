import * as React from 'react';
import { View, Button, Image } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import { Feed } from '../models/Feed';
import { IconSize, Colors } from '../styles';

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

const Favicon = (props) => (
    <View style={{
        paddingVertical: 16,
        paddingLeft: 5,
    }}>
        { props.uri != null && props.uri !== '' &&
            <Image
                source={{
                    uri: props.uri,
                }}
                style={{
                    width: IconSize.LARGE_LIST_ICON,
                    height: IconSize.LARGE_LIST_ICON,
                }}
            />
        }
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
                <SettingsList borderColor={Colors.LIGHTER_GRAY} defaultItemSize={60}>
                    {this.props.feeds.map(feed => (
                        <SettingsList.Item
                            title={feed.name}
                            titleInfo={feed.url}
                            icon={<Favicon uri={feed.favicon} />}
                            key={feed.url}
                            onPress={() => {
                                this.editFeed(feed);
                            }}
                        />
                    ))}
                </SettingsList>
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

    private editFeed(feed) {
        this.props.navigation.navigate('EditFeed', { feed: feed });
    }
}
