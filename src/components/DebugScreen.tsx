import * as React from 'react';
import { View, Alert, StyleSheet, Button } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AsyncStorageWrapper, Storage } from '../Storage';
import { LocalPostManager } from '../LocalPostManager';
import StateTracker from '../StateTracker';
import { Version } from '../Version';
import { Post, ImageData } from '../models/Post';

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

export class DebugScreen extends React.Component<any, any> {
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
                                <Ionicons name='md-key' size={30} color='gray' />
                            }
                            title='List cache'
                            onPress={async () => await this.onListCache()}
                        />

                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-key' size={30} color='gray' />
                            }
                            title='List sync state'
                            onPress={async () => await this.onListSyncState()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-warning' size={30} color='gray' />
                            }
                            title='Clear database'
                            onPress={async () => await this.onClearDatabase()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-sync' size={30} color='gray' />
                            }
                            title='Sync posts'
                            onPress={async () => await this.onSyncPosts()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons name='md-sync' size={30} color='gray' />
                            }
                            title='Clean post image data'
                            onPress={async () => await this.onClearPostImageData()}
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
        const posts = LocalPostManager.getAllPosts();
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
            console.log(JSON.stringify(postCopy));
        });
    }

    private async onListDatabase() {
        const keyValues = await AsyncStorageWrapper.getAllKeyValues();
        if (keyValues) {
            keyValues.map((keyValue) => {
                const [key, value] = keyValue;
                // tslint:disable-next-line:no-console
                console.log('onListDatabase: ', key, value);
            });
        }
    }

    private async onListCache() {
        const posts = await LocalPostManager.getAllPosts();
        // tslint:disable-next-line:no-console
        posts.map(post => console.log('onListCache: ', post));
    }

    private async onListSyncState() {
        const post = await AsyncStorageWrapper.getItem('post');
        if (post) {
            // tslint:disable-next-line:no-console
            console.log('Post state: ', post);
        }
        const sync = await AsyncStorageWrapper.getItem('sync:default');
        if (sync) {
            // tslint:disable-next-line:no-console
            console.log('Sync state: ', sync);
        }
    }

    private async onListDatabaseKeys() {
        const keys = await AsyncStorageWrapper.getAllKeys();
        if (keys) {
            // tslint:disable-next-line:no-console
            keys.map((key) => console.log('onListDatabaseKeys: ', key));
        }
    }

    private async onClearDatabase() {
        await AsyncStorageWrapper.clear();
        for (const key of Object.keys(Storage)) {
            Storage[key].clear();
        }
        LocalPostManager.clearPosts();
        Alert.alert('Database is cleared');
    }

    private async onSyncPosts() {
        await LocalPostManager.syncPosts();
        StateTracker.updateVersion(StateTracker.version + 1);
    }

    private async onClearPostImageData() {
        const allPosts = await Storage.post.getAllValues();
        console.log('onClearPostImageData: all posts ', allPosts.length);
        const imageHasData = (image: ImageData) => image.data != null;
        const postHasImageData = (post: Post) => post.images.filter(image => imageHasData(image)).length > 0;
        const postsWithImageData = allPosts.filter(post => postHasImageData(post));
        console.log('onClearPostImageData: posts with image data ', postsWithImageData.length);

        let counter = 0;
        for (const post of postsWithImageData) {
            const updatedPost: Post = {
                ...post,
                images: post.images.map<ImageData>(image => {
                    return {
                        ...image,
                        data: undefined,
                    };
                }),
            };
            Storage.post.set(updatedPost);
            counter += 1;
        }
        console.log('onClearPostImageData: updated ', counter);
    }
}
