import * as React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import { Feed } from '../models/Feed';

const styles = StyleSheet.create({
    imageStyle: {
        marginLeft: 15,
        alignSelf: 'center',
        height: 30,
        width: 30,
    },
    titleInfoStyle: {
        fontSize: 16,
        color: '#8e8e93',
    },
});

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
                <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                    <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
                        {this.props.feeds.map(feed => (
                            <SettingsList.Item
                                title={feed.name}
                                titleInfo={feed.url}
                                key={feed.url}
                                onPress={() => {
                                    this.editFeed(feed);
                                }}
                            />
                        ))}
                    </SettingsList>
                </View>
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
