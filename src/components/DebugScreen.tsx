import * as React from 'react';
import { View, Alert, StyleSheet, Button } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Communications from 'react-native-communications';

import { AsyncStorageWrapper, Storage } from '../Storage';
import { Version } from '../Version';
import { Config } from '../Config';
import { upload, download, downloadUserFeed, downloadUserFeedTemplate, updateUserFeed } from '../Swarm';
import { AppState } from '../reducers';
import { Post } from '../models/Post';
import { Debug } from '../Debug';

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

interface DebugScreenNavigationActions {
    back: any;
}

const navigationActions: DebugScreenNavigationActions = {
    back: undefined,
};

export interface StateProps {
    appState: AppState;
    navigation: any;
}

export interface DispatchProps {
    createPost: (post: Post) => void;
    onAppStateReset: () => void;
}

type Props = StateProps & DispatchProps;

export class DebugScreen extends React.Component<Props, any> {
    public static navigationOptions = {
        header: undefined,
        title: 'Debug menu',
        headerLeft: <Button title='Back' onPress={() => navigationActions.back!()} />,
    };

    constructor(props) {
        super(props);
        this.onValueChange = this.onValueChange.bind(this);
        this.state = { switchValue: false };
        navigationActions.back = this.props.navigation.goBack;
    }

    public render() {
        const version = Version;
        return (
            <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                    <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
                         <SettingsList.Item
                            icon={
                                <Ionicons name='md-list' size={30} color='gray' />
                            }
                            title='List database'
                            onPress={async () => await this.onListDatabase()}
                        />
                         <SettingsList.Item
                            icon={
                                <Ionicons name='md-list' size={30} color='gray' />
                            }
                            title='List posts'
                            onPress={async () => await this.onListPosts()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-key' size={30} color='gray' />
                            }
                            title='List database keys'
                            onPress={async () => await this.onListDatabaseKeys()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-sync' size={30} color='gray' />
                            }
                            title='Send the database in an email'
                            onPress={async () => await this.onSendEmailOfDatabase()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-sync' size={30} color='gray' />
                            }
                            title='Upload to swarm'
                            onPress={async () => await this.onUploadToSwarm()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-sync' size={30} color='gray' />
                            }
                            title='Migrate posts'
                            onPress={async () => await this.onMigratePosts()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-sync' size={30} color='gray' />
                            }
                            title='App state reset'
                            onPress={this.props.onAppStateReset}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-sync' size={30} color='gray' />
                            }
                            title='Test feed update'
                            onPress={async () => await this.onTestFeedUpdate()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-sync' size={30} color='gray' />
                            }
                            title='Logs'
                            onPress={() => this.props.navigation.navigate('LogViewer')}
                        />

                        <SettingsList.Item
                            title={version}
                        />

                    </SettingsList>
                </View>
            </View>
        );
    }

    private onValueChange(value) {
        this.setState({ switchValue: value });
    }

    private async onListPosts() {
        const posts = this.props.appState.localPosts.toArray();
        posts.map(post => {
            const postCopy = {
                ...post,
                images: post.images.map(image => {
                    return {
                        ...image,
                        data: undefined,
                    };
                }),
            };
            // tslint:disable-next-line:no-console
            Debug.log(JSON.stringify(postCopy));
        });
    }

    private async onListDatabase() {
        const keyValues = await AsyncStorageWrapper.getAllKeyValues();
        if (keyValues) {
            keyValues.map((keyValue) => {
                const [key, value] = keyValue;
                // tslint:disable-next-line:no-console
                Debug.log('onListDatabase: ', key, value);
            });
        }
    }

    private async onListDatabaseKeys() {
        const keys = await AsyncStorageWrapper.getAllKeys();
        if (keys) {
            // tslint:disable-next-line:no-console
            keys.map((key) => Debug.log('onListDatabaseKeys: ', key));
        }
    }

    private async onUploadToSwarm() {
        const hash = await upload('test');
        Debug.log('Uploaded file. Address:', hash);
        const data = await download(hash);
        Debug.log('Downloaded file: ', data);
    }

    private async onSendEmailOfDatabase() {
        const keyValues = await AsyncStorageWrapper.getAllKeyValues();
        const databaseDump = JSON.stringify(keyValues);
        const date = new Date(Date.now()).toJSON;
        Communications.email(Config.email, '', '', 'Postmodern database dump ' + date, databaseDump);
    }

    private async onMigratePosts() {
        const asyncStoragePosts = await Storage.post.getAllValues();
        const oldPosts = asyncStoragePosts.sort((a, b) => a.createdAt - b.createdAt);
        for (const post of oldPosts) {
            this.props.createPost(post);
        }
        Debug.log(oldPosts);
    }

    private onTestFeedUpdate = async () => {
        const identity = this.props.appState.author.identity!;
        const feedTemplate = await downloadUserFeedTemplate(identity);
        const data = 'hello';
        const text = await updateUserFeed(feedTemplate, identity, data);
        const latestData = await downloadUserFeed(identity);
        Debug.log('onTestFeedUpdate: ', latestData);
    }
}
