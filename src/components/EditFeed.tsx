import * as React from 'react';
import { View, FlatList, Text, TextInput, Alert, StyleSheet, Button, Image } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { RSSFeedManager } from '../RSSPostManager';
import { Utils } from '../Utils';
import { Feed } from '../models/Feed';

const navigationActions = {};

const styles = StyleSheet.create({
  titleInfoStyle:{
    fontSize: 14,
    color: '#8e8e93'
  }
});

interface EditFeedState {
    feed: Feed;
    checked: boolean;
    loading: boolean;
}

export class EditFeed extends React.Component<any, EditFeedState> {
    state = {
        feed: this.props.navigation.state.params.feed,
        checked: false,
        loading: false,
    }

    constructor(props) {
        super(props);
        navigationActions['Back'] = this.props.navigation.goBack;
        navigationActions['Add'] = this.onAdd.bind(this);
    }

    static navigationOptions = {
        header: undefined,
        title: 'Feed list',
        headerLeft: <Button title='Back' onPress={() => navigationActions['Back']()} />,
        headerRight: <Button title='Add' onPress={() => navigationActions['Add']()} />,
    };

    onAdd() {
        
    }


    async fetchFeed() {
        this.setState({
            loading: true,
        });

        const url = Utils.getCanonicalUrl(this.state.feed.feedUrl);
        const feed = await RSSFeedManager.fetchFeedFromUrl(url);
        if (feed) {
            this.setState({
                checked: true,
                loading: false,
                feed: feed,
            });
            return;
        } else {
            this.setState({
                loading: false,
            });            
        }
    }

    render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4', flex: 1, flexDirection: 'column' }}>
                <Text>Link to the feed</Text>
                <TextInput
                    value={this.state.feed.feedUrl}
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        borderBottomColor: 'lightgray',
                        borderBottomWidth: 1,
                        borderTopColor: 'lightgray',
                        borderTopWidth: 1,
                        paddingHorizontal: 5,
                        paddingVertical: 8,
                        color: 'gray',
                        fontSize: 14,
                    }}
                    onChangeText={(text) => this.setState({feed: {...this.state.feed, feedUrl: text}})}
                />
                { this.state.checked 
                ? <Ionicons name="md-checkmark" size={30} color="gray" />
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
        )
    }
}
