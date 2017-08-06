import * as React from 'react';
import { View, FlatList, Text, Alert, StyleSheet, Button } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AsyncStorageWrapper, Storage } from '../Storage';
import { PostManager } from '../PostManager';
import { ImageDownloader } from '../ImageDownloader'
import StateTracker from '../StateTracker';

const styles = StyleSheet.create({
    imageStyle: {
        marginLeft: 15,
        alignSelf: 'center',
        height: 30,
        width: 30
    },
    titleInfoStyle: {
        fontSize: 16,
        color: '#8e8e93'
    }
});

const navigationActions = {}

class DebugScreen extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.onValueChange = this.onValueChange.bind(this);
        this.state = { switchValue: false };
        navigationActions['Back'] = this.props.navigation.goBack;
    }

    static navigationOptions = {
        header: undefined,
        title: 'Debug menu',
        headerLeft: <Button title='Back' onPress={() => navigationActions['Back']()} />,
    };

    onValueChange(value) {
        this.setState({ switchValue: value });
    }

    async onDownloadImages() {
        const posts = PostManager.getAllPosts();
        const firstPost = posts[0];
        const imgSrc = await ImageDownloader.imageUriToBase64(firstPost.images[0].uri, 300, 300);
        console.log(imgSrc);
    }

    async onListPosts() {
        const posts = PostManager.getAllPosts();
        posts.map(post => {
            const postCopy = {...post, images: post.images.map(image => { return {...image, data: undefined}})};
            console.log(JSON.stringify(postCopy));
        })
    }

    async onListDatabase() {
        const keyValues = await AsyncStorageWrapper.getAllKeyValues();
        if (keyValues) {
            keyValues.map((keyValue) => {
                const [key, value] = keyValue
                console.log('onListDatabase: ', key, value)
            });
        }
    }

    async onListCache() {
        const posts = await PostManager.getAllPosts();
        posts.map(post => console.log('onListCache: ', post));
    }

    async onListSyncState() {
        const post = await AsyncStorageWrapper.getItem('post');
        if (post) {
            console.log('Post state: ', post);
        }
        const sync = await AsyncStorageWrapper.getItem('sync:default');
        if (sync) {
            console.log('Sync state: ', sync);
        }
    }

    async onListDatabaseKeys() {
        const keys = await AsyncStorageWrapper.getAllKeys();
        if (keys) {
            keys.map((key) => console.log('onListDatabaseKeys: ', key));
        }
    }

    async onClearDatabase() {
        await AsyncStorageWrapper.clear();
        for (const key of Object.keys(Storage)) {
            Storage[key].clear();
        }
        PostManager.clearPosts();
        Alert.alert('Database is cleared');
    }

    async onSyncPosts() {
        await PostManager.syncPosts();
        StateTracker.updateVersion(StateTracker.version + 1);
    }

    render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                    <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
                         <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-list" size={30} color="gray" />
                            }
                            title='List database'
                            onPress={async () => await this.onListDatabase()}
                        />
                         <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-list" size={30} color="gray" />
                            }
                            title='List posts'
                            onPress={async () => await this.onListPosts()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-key" size={30} color="gray" />
                            }
                            title='List database keys'
                            onPress={async () => await this.onListDatabaseKeys()}
                        /> 
                        <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-key" size={30} color="gray" />
                            }
                            title='List cache'
                            onPress={async () => await this.onListCache()}
                        /> 

                        <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-key" size={30} color="gray" />
                            }
                            title='List sync state'
                            onPress={async () => await this.onListSyncState()}
                        /> 
                        <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-warning" size={30} color="gray" />
                            }
                            title='Clear database'
                            onPress={async () => await this.onClearDatabase()}
                        />
                        <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-sync" size={30} color="gray" />
                            }
                            title='Sync posts'
                            onPress={async () => await this.onSyncPosts()}
                        /> 
                        <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-sync" size={30} color="gray" />
                            }
                            title='Download image'
                            onPress={async () => await this.onDownloadImages()}
                        /> 

                    </SettingsList>
                </View>
            </View>
        )
    }
}

export default DebugScreen;