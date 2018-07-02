import * as React from 'react';
import {
    TextInput,
    Alert,
    StyleSheet,
    Button,
    View,
    Text,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { RSSFeedManager, RSSPostManager } from '../RSSPostManager';
import { Utils } from '../Utils';
import { Feed } from '../models/Feed';
import { Storage } from '../Storage';

interface EditFeedNavigationActions {
    back?: () => void;
    add?: () => void;
}

const navigationActions: EditFeedNavigationActions = {
    back: undefined,
    add: undefined,
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#EFEFF4',
        flex: 1,
        flexDirection: 'column',
    },
    titleInfo: {
        fontSize: 14,
        color: '#8e8e93',
    },
    linkInput: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: 'gray',
        fontSize: 16,
    },
    deleteButtonContainer: {
        backgroundColor: 'white',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    centerIcon: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'column',
        height: 40,
        backgroundColor: '#EFEFF4',
        paddingTop: 10,
    },
});

interface EditFeedState {
    feed: Feed;
    checked: boolean;
    loading: boolean;
}

export class EditFeed extends React.Component<any, EditFeedState> {
    public static navigationOptions = {
        header: undefined,
        title: 'Feed list',
        headerLeft: <Button title='Back' onPress={() => navigationActions.back!()} />,
    };

    public state: EditFeedState = {
        feed: this.props.navigation.state.params.feed,
        checked: false,
        loading: false,
    };

    constructor(props) {
        super(props);
        navigationActions.back = this.goBack.bind(this);
        navigationActions.add = this.onAdd.bind(this);
    }

    public async onAdd() {
        await Storage.feed.set(this.state.feed);
        await RSSPostManager.feedManager.loadFeedsFromStorage();
        this.goBack();
    }

    public goBack() {
        this.props.navigation.goBack();
    }

    public async fetchFeed() {
        this.setState({
            loading: true,
        });

        const url = Utils.getCanonicalUrl(this.state.feed.feedUrl);
        console.log('fetchFeed: url: ', url);
        const feed = await this.fetchFeedFromUrl(url);
        console.log('fetchFeed: feed: ', feed);

        if (feed != null && feed.feedUrl !== '') {
            this.setState({
                checked: true,
                loading: false,
                feed: feed,
            });
            await this.onAdd();
        } else {
            this.onFailedFeedLoad();
        }
    }

    public render() {
        return (
            <View style={styles.container}>
                <TextInput
                    value={this.state.feed.feedUrl}
                    style={styles.linkInput}
                    onChangeText={(text) => this.setState({feed: {...this.state.feed, feedUrl: text}})}
                    placeholder='Link of the feed'
                    autoCapitalize='none'
                    autoFocus={true}
                />
                { this.state.checked
                  ?
                    <View style={styles.centerIcon}>
                        <Ionicons name='md-checkmark' size={40} color='green' />
                    </View>
                  : this.state.loading
                    ?
                        <View style={styles.centerIcon}>
                            <ActivityIndicator size='large' color='grey' />
                        </View>
                    : this.state.feed._id != null
                        ? <Button
                            title='Delete'
                            onPress={async () => this.onDelete()}
                            disabled={this.state.loading}
                        />
                        : <Button
                            title='Fetch'
                            onPress={async () => await this.fetchFeed()}
                            disabled={this.state.loading}
                        />
                }

                <Text>{this.state.feed.name}</Text>
                <Text>{this.state.feed.url}</Text>
                <Text>{this.state.feed.feedUrl}</Text>
                <Text>{this.state.feed.favicon}</Text>
            </View>
        );
    }

    private fetchFeedFromUrl = async (url: string): Promise<Feed | null> => {
        try {
            const feed = await RSSFeedManager.fetchFeedFromUrl(url);
            console.log('fetchFeed: feed: ', feed);
            return feed;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    private onDelete = () => {
        const options: any[] = [
            { text: 'Yes', onPress: async () => await this.deleteFeedAndGoBack() },
            { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        ];

        Alert.alert('Are you sure you want to delete the feed?',
            undefined,
            options,
            { cancelable: true }
        );
    }

    private onFailedFeedLoad = () => {
        const options: any[] = [
            { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        ];

        Alert.alert('Failed to load feed!',
            undefined,
            options,
            { cancelable: true }
        );

        this.setState({
            loading: false,
        });
    }

    private deleteFeedAndGoBack = async () => {
        if (this.state.feed._id != null) {
            await Storage.feed.delete(this.state.feed._id);
        }
        await RSSPostManager.feedManager.loadFeedsFromStorage();
        this.goBack();
    }
}
