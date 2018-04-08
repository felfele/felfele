import * as React from 'react';
import { Linking, Clipboard, CameraRoll, Dimensions, TextInput, Text, View, WebView, TouchableOpacity, Alert, ScrollView, FlatList, Image, RefreshControl, StyleSheet, StatusBar, Platform } from 'react-native';
import { Gravatar } from 'react-native-gravatar';
import Markdown from 'react-native-easy-markdown';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFetchBlob from 'react-native-fetch-blob';

import { AsyncImagePicker, Response as ImagePickerResponse } from '../AsyncImagePicker';
import StateTracker from '../StateTracker';
import { Config } from '../Config';
import { Backend } from '../Backend';
import { PostManager } from '../PostManager';
import { Post, ImageData } from '../models/Post';
import { Debug } from '../Debug';
import { NetworkStatus } from '../NetworkStatus';
import { DateUtils } from '../DateUtils';
import { FeedHeader } from './FeedHeader';
import { Utils } from '../Utils';

const WindowWidth = Dimensions.get('window').width;

interface YourFeedProps {
    uri: string;
    navigation: any;
    post: any;
    postManager: PostManager;
}

interface YourFeedState {
    version: number;
    uri: string;
    selectedPost: Post | null;
    isRefreshing: boolean;
    isOnline: boolean;
    currentTime: number;
    posts: Post[];
}

export class YourFeed extends React.PureComponent<YourFeedProps, YourFeedState> {
    private containerStyle = {};

    constructor(props) {
        super(props);
        this.state = {
            version: StateTracker.version,
            uri: this.props.uri,
            selectedPost: null,
            isRefreshing: false,
            isOnline: NetworkStatus.isConnected(),
            currentTime: Date.now(),
            posts: [],
        }

        this.containerStyle = {
            backgroundColor: '#fff',
            borderRadius: 3,
            padding: 0,
            paddingBottom: 10,
            paddingTop: 0,
            marginBottom: 15,
            marginTop: 0,
        }

        NetworkStatus.addConnectionStateChangeListener((result) => {
            this.onConnectionStateChange(result)
        });

        StateTracker.listen((oldVersion, newVersion) => {
            this.updateVersion(oldVersion, newVersion)
        });

        const refreshInterval = 60 * 1000;
        setInterval(() => {
                this.setState({currentTime: Date.now()})
            },
            refreshInterval
        );
    }

    componentDidMount() {
        this.props.postManager.loadPosts().then(() => {
            this.setState({
                posts: this.props.postManager.getAllPosts()
            })
        });
    }

    updateVersion(oldVersion, newVersion) {
        if (newVersion != this.state.version) {
            this.setState({
                version: newVersion,
                uri: this.state.uri + '#' + newVersion,
                posts: this.props.postManager.getAllPosts(),
            })
        }
    }

    onConnectionStateChange(connected) {
        this.setState({
            isOnline: connected,
        })
    }

    async onRefresh() {
        this.setState({
            isRefreshing: true,
        });
        try {
            await this.props.postManager.syncPosts();
            this.setState({
                posts: this.props.postManager.getAllPosts(),
                isRefreshing: false,
            })
        } catch (e) {
            this.setState({
                isRefreshing: false,
            });
            Alert.alert(
                'Error',
                'No connection to the server, try again later!',
                [
                    {text: 'OK', onPress: () => console.log('OK pressed')},
                ]
            );
        }

    }

    getImageUri(image: ImageData) {
        if (image.localPath) {
            return image.localPath;
        }
        return image.uri;
    }

    async openPost(post: Post) {
        if (post.link) {
            await Linking.openURL(post.link);
        }
    }

    isPostSelected(post: Post) {
        return this.state.selectedPost && this.state.selectedPost._id == post._id;
    }

    togglePostSelection(post: Post) {
        if (this.isPostSelected(post)) {
            this.setState({ selectedPost: null });
        } else {
            this.setState({ selectedPost: post });
        }
    }

    onDeleteConfirmation(post: Post) {
        Alert.alert(
            'Are you sure you want to delete?',
            undefined,
            [
                { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                { text: 'OK', onPress: async () => await this.props.postManager.deletePost(post) },
            ],
            { cancelable: false }
        );
    }

    onEditPost(post: Post) {
        this.props.navigation.navigate('Post', {post: post});
    }

    renderButtonsIfSelected(post: Post) {
        const iconSize = 24;
        const isPostLiked = (post) => false;
        if (this.isPostSelected(post)) {
            return (
                <View style={styles.itemImageContainer}>
                    { post.author == null &&
                        <TouchableOpacity style={styles.edit} onPress={() => this.onEditPost(post)}>
                            <Icon name='ios-create-outline' size={iconSize} color='black' />
                        </TouchableOpacity>
                    }
                    <TouchableOpacity style={styles.like}>
                        {!isPostLiked(post) ? <Icon name='ios-heart-outline' size={iconSize} color='black' /> : <Icon name='ios-heart' size={30} color='red' />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.comment} onPress={() => alert('go comment!')}>
                        <Icon name='ios-chatbubbles-outline' size={iconSize} color='black' />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.share} onPress={() => this.props.navigation.navigate('Share', {link: 'http://192.168.1.49:2368#' + post._id})}>
                        <Icon name='ios-redo-outline' size={iconSize} color='black' />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.share} onPress={() => this.onDeleteConfirmation(post)}>
                        <Icon name='ios-trash-outline' size={iconSize} color='black' />
                    </TouchableOpacity>
                </View>
            );
        }
        return [];
    }

    renderCardTopIcon(post: Post) {
        if (post.author) {
            return (
                <Image source={{uri: post.author.faviconUri}} style={styles.image} />
            );
        } else {
            return (
                <Gravatar options={{
                    email: Config.loginData.username,
                    secure: true,
                    parameters: { 'size': '100', 'd': 'mm' },
                }}
                    style={styles.image}
                />
            );
        }
    }

    renderCardTop(post: Post) {
        const printableTime = DateUtils.printableElapsedTime(post.createdAt);
        const humanTime = DateUtils.timestampToDateString(post.createdAt);
        const currentTime = Date.now();
        const username = post.author ? post.author.name : 'Attila';
        const url = post.link || '';
        const hostnameText = url === '' ? '' : ' -  ' + Utils.getHumanHostname(url);
        return (
            <View style={styles.infoContainer}>
                { this.renderCardTopIcon(post) }
                <View style={styles.usernameContainer}>
                    <Text style={styles.username} numberOfLines={1}>{username}</Text>
                    <Text style={styles.location}>{printableTime}{hostnameText}</Text>
                </View>
            </View>
        );
    }

    renderCardWithOnlyText(post: Post) {
        return (
            <View
                style={{...this.containerStyle,
                    margin: 0,
                    paddingTop: 5,
                    paddingBottom: 5,
                    borderWidth: 0,
                }}
                key={'card-' + post._id}
            >
                <TouchableOpacity
                    onLongPress={ () => this.togglePostSelection(post) }
                    onPress={ () => this.openPost(post)}
                    activeOpacity={1}
                >
                    { this.renderCardTop(post) }
                    <Markdown style={styles.markdownStyle}>{post.text}</Markdown>
                </TouchableOpacity>
                { this.renderButtonsIfSelected(post) }
            </View>
        );
    }

    renderCardWithMultipleImages(post: Post) {
        return (
            <View
                style={this.containerStyle}
                key={'card-' + post._id}

            >
                <TouchableOpacity
                    style={{ paddingTop: 0 }}
                    onLongPress={ () => this.togglePostSelection(post) }
                    onPress={ () => this.openPost(post)}
                    activeOpacity={1}
                >
                    {
                        post.images.map((image, index) => {
                            return <TouchableOpacity
                                        key={`image-${post._id}-${index}`}
                                        onLongPress={ () => {
                                            this.setState({selectedPost: post});
                                        }}
                                        activeOpacity={0.1}
                                    >
                                        <Image
                                            source={{
                                                uri: this.getImageUri(image),
                                            }}
                                        />;
                                    </TouchableOpacity>
                        })
                    }
                    { post.text === '' ||
                        <Markdown style={styles.markdownStyle}>{post.text}</Markdown>
                    }

                </TouchableOpacity>
                { this.renderButtonsIfSelected(post) }
            </View>
        );
    }

    renderCard(post: Post) {
        const toBase64 = (data) => `data:image/gif;base64,${data}`;

        if (post.images.length === 0) {
            return this.renderCardWithOnlyText(post);
        } else if (post.images.length > 1) {
            return this.renderCardWithMultipleImages(post);
        } else {
            return (
                <View
                    style={{...this.containerStyle,
                        margin: 0,
                        padding: 0,
                        paddingTop: 5,
                        paddingBottom: 5,
                        borderWidth: 0,
                    }}
                    key={'card-' + post._id}
                >

                    { this.renderCardTop(post) }
                    <TouchableOpacity
                        activeOpacity={1}
                        onLongPress={ () => this.togglePostSelection(post) }
                        onPress={ () => this.openPost(post)}
                        style = {{
                            backgroundColor: '#fff',
                            padding: 0,
                            paddingTop: 0,
                            marginTop: 0,
                        }}
                    >
                        <Image
                            source={{
                                uri: this.getImageUri(post.images[0]),
                            }}
                            style={{
                                width: WindowWidth,
                                height: WindowWidth,
                            }}
                        />
                        { post.text === '' ||
                            <Markdown style={styles.markdownStyle}>{post.text}</Markdown>
                        }
                        { this.renderButtonsIfSelected(post) }
                    </TouchableOpacity>
                </View>
            );
        }
    }

    public render() {
        return (
            <View
                style={{
                    flexDirection: 'column',
                    padding: 0,
                    flex: 1,
                    height: '100%',
            }
            }>
                <StatusBar translucent={true} />
                <View>
                    { this.renderOfflineHeader() }
                    <FlatList
                        ListHeaderComponent={this.renderListHeader}
                        data={this.state.posts}
                        renderItem={(obj) => this.renderCard(obj.item)}
                        keyExtractor={(item, index) => item._id}
                        extraData={this.state}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.isRefreshing}
                                onRefresh={async () => this.onRefresh() }
                                progressViewOffset={HeaderOffset}
                                style={styles.refreshControl}
                            />
                        }
                    />
                </View>
                <View style={styles.translucentBar} ></View>
            </View>
        );
    }

    private renderOfflineHeader() {
        if (NetworkStatus.isConnected()) {
            return [];
        }
        return (
            <View style={{
                height: HeaderOffset,
                backgroundColor: 'black',
            }}
            >
            </View>
        );
    }

    private renderListHeader = () => {
        return (
            <FeedHeader
                post={this.props.post}
                navigation={this.props.navigation}
                postManager={this.props.postManager} />
        );
    }
}

const HeaderOffset = 20;
const TranslucentBarHeight = Platform.OS === 'ios' ? HeaderOffset : 0;
const styles = StyleSheet.create({
    container: {backgroundColor: 'white', paddingTop: 5},
    infoContainer : {flexDirection: 'row', height: 38, alignSelf: 'stretch', marginBottom: 5, marginLeft: 5},
    image: {borderRadius : 3, width: 32 , height: 32, marginHorizontal: 4 , marginVertical: 3 },
    usernameContainer: {justifyContent: 'center', flexDirection: 'column'},
    location: {fontSize: 10, color: 'gray'},
    itemImageContainer: {flexDirection: 'row', height: 40, alignSelf: 'stretch', marginLeft: 5},
    like: {marginHorizontal: 5, marginVertical: 5, marginLeft: 5},
    comment: {marginHorizontal: 10, marginVertical: 5},
    share: {marginHorizontal: 10, marginVertical: 5},
    edit: {marginHorizontal: 10, marginVertical: 5},
    likeCount: {flexDirection: 'row', alignItems: 'center', marginLeft: 2},
    commentItem: {fontSize: 10 , color: 'rgba(0, 0, 0, 0.5)', marginTop: 5},
    captionContainer: {marginTop: 2 , flexDirection: 'row', alignItems: 'center'},
    captionText: { fontSize: 12, fontWeight: 'bold' },
    dateText: {fontSize: 8 , color: 'rgba(0, 0, 0, 0.5)', marginTop: 5},
    seperator: {height: 1, alignSelf: 'stretch', marginHorizontal: 10, backgroundColor: 'rgba(0, 0, 0, 0.2)'},
    hashTag: {fontStyle: 'italic', color: 'blue'},
    footer: {marginVertical: 5, alignSelf: 'stretch', marginHorizontal: 20, flexDirection: 'column'},
    username: {fontWeight: 'bold'},
    text: {fontSize: 12, color: 'black'},
    likedContainer: {backgroundColor: 'transparent', flex: 1, justifyContent: 'center', alignItems: 'center'},
    markdownStyle: {marginVertical: 10, marginHorizontal: 10},
    translucentBar: {
        height: TranslucentBarHeight,
        width: '100%',
        position: 'absolute',
        backgroundColor: '#e6e6e6ff',
        opacity: 0.5,
        top: 0,
        left: 0,
    },
    refreshControl: {
    },
});
