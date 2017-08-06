import * as React from 'react';
import { TextInput, Text, View, WebView, TouchableOpacity, Alert, ScrollView, FlatList, Image, RefreshControl } from 'react-native';
import { Card, Button, ButtonGroup, List, Tile, Icon } from 'react-native-elements';
import { ImagePicker } from '../ImagePicker';
import StateTracker from '../StateTracker';
import { Config } from '../Config';
import { Backend } from '../Backend';
import { PostManager } from '../PostManager';
import { Post, ImageData } from '../models/Post';
import { Debug } from '../Debug';

class YourFeed extends React.Component<any, any> {
    static navigationOptions = {
        header: <View style={{ height: 100, backgroundColor: 'magenta' }} />
    }

    constructor(props) {
        super(props);
        this.state = {
            version: StateTracker.version,
            uri: this.props.uri,
            posts: this.props.posts,
            selectedPost: null,
            refreshing: false,
        }

        StateTracker.listen((oldVersion, newVersion) => this.updateVersion(oldVersion, newVersion));
    }

    componentDidMount() {
        PostManager.loadPosts().then(() => {
            this.setState({
                posts: PostManager.getAllPosts()
            })
        });
    }

    updateVersion(oldVersion, newVersion) {
        if (newVersion != this.state.version) {
            this.setState({
                version: newVersion,
                uri: this.state.uri + '#' + newVersion,
                posts: PostManager.getAllPosts(),
            })
        }
    }

    async onRefresh() {
        await PostManager.syncPosts();
        this.setState({
            posts: PostManager.getAllPosts()
        })
    }

    openImagePicker = async () => {
        const pickerResult = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            base64: true,
            exif: true,
        });
        if (pickerResult.cancelled == false) {
            const data: ImageData = {
                uri: pickerResult.uri,
                width: pickerResult.width,
                height: pickerResult.height,
                data: pickerResult.base64,
            }

            const post: Post = {
                images: [data],
                text: '',
                createdAt: Date.now(),
            }

            try {
                PostManager.saveAndSyncPost(post);
            } catch (e) {
                console.log(e);
                Alert.alert(
                    'Error',
                    'Posting failed, try again later!',
                    [
                        { text: 'OK', onPress: () => console.log('OK pressed') },
                    ]
                );
            }
        }
    }

    isPostSelected(post) {
        return this.state.selectedPost && this.state.selectedPost._id == post._id;
    }

    renderButtonsIfSelected(post) {
        if (this.isPostSelected(post)) {
            return (
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch'}}>
                    <Button
                        containerViewStyle={{flex: 1, alignSelf: 'stretch', padding: 0, margin: 0}}
                        backgroundColor='#ff3325'
                        fontSize={12}
                        title='DELETE' 
                        icon={{name: 'delete'}} 
                        onPress={async () => {
                            this.setState({selectedPost: null});
                            await PostManager.deletePost(post);
                        }}
                    />
                    <Button 
                        containerViewStyle={{flex: 1, alignSelf: 'stretch', padding: 0, margin: 0}}
                        backgroundColor='#4078ff'
                        fontSize={12}
                        title='SHARE' 
                        icon={{name: 'share'}} 
                        onPress={() => {
                            this.props.navigation.navigate('Share', {link: 'http://192.168.1.49:2368#' + post._id});
                        }}
                    />
                </View>
            )
        }
        return [];
    }

    renderCardWithOnlyText(post) {
        return (
            <Card
                containerStyle={{ padding: 0, paddingTop: 15, paddingBottom: 15, margin: 0 }}
                key={'card-' + post._id}
            >
                <TouchableOpacity
                    onLongPress={ () => {
                        this.setState({selectedPost: post});
                    }}
                >
                    <Text>{post.text}</Text>
                </TouchableOpacity>
                { this.renderButtonsIfSelected(post) }
            </Card>
        )
    }

    renderCardWithMultipleImages(post) {
        return (
            <Card
                containerStyle={{ padding: 0, paddingTop: 15, paddingBottom: 15, margin: 0 }}
                key={'card-' + post._id}

            >
                <TouchableOpacity 
                    style={{ paddingTop: 0 }}
                    onLongPress={ () => {
                        this.setState({selectedPost: post});
                    }}
                >
                    <Text>{post.text}</Text>
                    {
                        post.images.map((image, index) => {
                            return <Tile
                                imageSrc={{
                                    uri: image.uri,
                                }}
                                featured={false}
                                activeOpacity={0.1}
                                key={`image-${post._id}-${index}`}
                                onLongPress={ () => {
                                    this.setState({selectedPost: post});
                                }}
                            />
                        })
                    }
                </TouchableOpacity>
                { this.renderButtonsIfSelected(post) }
            </Card>
        )
    }

    renderCard(post: Post) {
        const toBase64 = (data) => `data:image/gif;base64,${data}`;

        if (post.images.length == 0) {
            return this.renderCardWithOnlyText(post);
        } else if (post.images.length > 1) {
            return this.renderCardWithMultipleImages(post);
        } else {
            return (
                // <Card
                //     containerStyle={{ padding: 0, paddingTop: 15, paddingBottom: 15, margin: 0 }}
                //     key={'card-' + post._id}
                // >
                        <Tile
                            imageSrc={{
                                uri: post.images[0].uri,
                            }}
                            title={post.text}
                            titleStyle={{ fontSize: 20 }}
                            featured={false}
                            activeOpacity={0}
                            key={`image-${post._id}`}
                            onPress={ () => {
                                if (this.isPostSelected(post)) {
                                    this.setState({selectedPost: null});
                                } else {
                                    this.setState({selectedPost: post});
                                }
                            }}
                            contentContainerStyle={{height: this.isPostSelected(post) ? 80 : 0, padding: 0, margin: 0, paddingBottom: 0, paddingTop: 0, paddingLeft: 0, paddingRight: 0, marginBottom: 15}}
                        >
                            { this.renderButtonsIfSelected(post) }
                        </Tile>
                // </Card>
            );
        }
    }

    render() {
        return (
            <View style={{ flexDirection: 'column', padding: 0, flex: 1, height: '100%' }}>
                <View style={{ flex: -1, flexDirection: 'row', borderBottomColor: 'lightgray', borderBottomWidth: 1, alignContent: 'stretch' }}>
                    <TouchableOpacity onPress={() => this.openImagePicker()} style={{ flex: 1 }}>
                        <Icon name='camera-alt' size={30} color='gray' style={{ paddingTop: 4, paddingLeft: 10 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.props.navigation.navigate(this.props.post)} style={{ flex: 6 }}>
                        <Text style={{ height: 40, color: 'gray', fontSize: 14, paddingLeft: 10, paddingTop: 10, alignSelf: 'stretch', flex: 5, flexGrow: 10 }}>What's on your mind?</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={this.state.posts}
                    renderItem={(obj) => this.renderCard(obj.item)}
                    keyExtractor={(item, index) => item._id}
                    extraData={this.state}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={async () => this.onRefresh() }
                        />
                    }
                />
            </View>
        )
    }
}

export default YourFeed;