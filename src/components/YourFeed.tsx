import * as React from 'react';
import {
    Linking,
    Dimensions,
    Text,
    View,
    TouchableOpacity,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    StatusBar,
    Platform,
    SafeAreaView,
} from 'react-native';
import { Gravatar } from 'react-native-gravatar';
import Markdown from 'react-native-easy-markdown';
import Icon from 'react-native-vector-icons/Ionicons';

import { Config } from '../Config';
import { PostManager } from '../PostManager';
import { Post, ImageData } from '../models/Post';
import { NetworkStatus } from '../NetworkStatus';
import { DateUtils } from '../DateUtils';
import { FeedHeader } from './FeedHeader';
import { Utils } from '../Utils';

const WindowWidth = Dimensions.get('window').width;

export interface DispatchProps {
    onRefreshPosts: () => void;
    onDeletePost: (post: Post) => void;
    onSavePost: (post: Post) => void;
}

export interface StateProps {
    navigation: any;
    posts: Post[];
}

interface YourFeedState {
    selectedPost: Post | null;
    isRefreshing: boolean;
    isOnline: boolean;
    currentTime: number;
}

export class YourFeed extends React.PureComponent<DispatchProps & StateProps, YourFeedState> {
    private containerStyle = {};

    constructor(props) {
        super(props);
        this.state = {
            selectedPost: null,
            isRefreshing: false,
            isOnline: NetworkStatus.isConnected(),
            currentTime: Date.now(),
        };

        this.containerStyle = {
            backgroundColor: '#fff',
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            padding: 0,
            paddingTop: 0,
            paddingBottom: 0,
            marginBottom: 12,
            marginTop: 0,
        };

        NetworkStatus.addConnectionStateChangeListener((result) => {
            this.onConnectionStateChange(result);
        });

        const refreshInterval = 60 * 1000;
        setInterval(() => {
                this.setState({currentTime: Date.now()});
            },
            refreshInterval
        );
    }

    public componentDidUpdate(prevProps) {
        if (this.props.posts !== prevProps.posts) {
            console.log('YourFeed.componentDidUpdate');
            this.setState({
                isRefreshing: false,
            });
        }
    }

    public render() {
        const isStatusBarHidden = Platform.OS === 'android' ? true : false;
        return (
            <SafeAreaView
                style={{
                    flexDirection: 'column',
                    padding: 0,
                    flex: 1,
                    height: '100%',
                    opacity: 0.96,
            }
            }>
                <StatusBar hidden={isStatusBarHidden} translucent={false} />
                <View>
                    { this.renderOfflineHeader() }
                    <FlatList
                        ListHeaderComponent={this.renderListHeader}
                        ListFooterComponent={this.renderListFooter}
                        data={this.props.posts}
                        renderItem={(obj) => this.renderCard(obj.item)}
                        keyExtractor={(item) => '' + item._id}
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
            </SafeAreaView>
        );
    }

    private onConnectionStateChange(connected) {
        this.setState({
            isOnline: connected,
        });
    }

    private async onRefresh() {
        this.setState({
            isRefreshing: true,
        });
        this.props.onRefreshPosts();
    }

    private getImageUri(image: ImageData) {
        if (image.localPath) {
            return image.localPath;
        }
        return image.uri;
    }

    private async openPost(post: Post) {
        if (post.link) {
            await Linking.openURL(post.link);
        }
    }

    private isPostSelected(post: Post) {
        return this.state.selectedPost && this.state.selectedPost._id === post._id;
    }

    private togglePostSelection(post: Post) {
        if (this.isPostSelected(post)) {
            this.setState({ selectedPost: null });
        } else {
            this.setState({ selectedPost: post });
        }
    }

    private onDeleteConfirmation(post: Post) {
        Alert.alert(
            'Are you sure you want to delete?',
            undefined,
            [
                { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                { text: 'OK', onPress: async () => await this.props.onDeletePost(post) },
            ],
            { cancelable: false }
        );
    }

    private onEditPost(post: Post) {
        this.props.navigation.navigate('Post', {post: post});
    }

    private renderButtonsIfSelected(post: Post) {
        const iconSize = 24;
        const isPostLiked = () => false;
        if (this.isPostSelected(post)) {
            return (
                <View style={styles.itemImageContainer}>
                    { post.author == null &&
                        <TouchableOpacity style={styles.edit} onPress={() => this.onEditPost(post)}>
                            <Icon name='ios-create-outline' size={iconSize} color='black' />
                        </TouchableOpacity>
                    }
                    <TouchableOpacity style={styles.like}>
                        {!isPostLiked() ? <Icon name='ios-heart-outline' size={iconSize} color='black' /> : <Icon name='ios-heart' size={30} color='red' />}
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

    private renderCardTopIcon(post: Post) {
        if (post.author) {
            return (
                <Image source={{uri: post.author.faviconUri}} style={styles.image} />
            );
        } else {
            return (
                <Gravatar options={{
                    email: Config.email,
                    secure: true,
                    parameters: { size: '100', d: 'mm' },
                }}
                    style={styles.image}
                />
            );
        }
    }

    private renderCardTop(post: Post) {
        const printableTime = DateUtils.printableElapsedTime(post.createdAt) + ' ago';
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

    private renderCardWithOnlyText(post: Post) {
        return (
            <View
                style={{...this.containerStyle,
                    margin: 0,
                    paddingTop: 5,
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

    private renderCard(post: Post) {
        if (post.images.length === 0) {
            return this.renderCardWithOnlyText(post);
        } else {
            return (
                <View
                    style={{...this.containerStyle,
                        margin: 0,
                        padding: 0,
                        paddingTop: 5,
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
                        {post.images.map((image, index) =>
                            <Image
                                key={image.uri + index}
                                source={{
                                    uri: this.getImageUri(image),
                                }}
                                style={{
                                    width: WindowWidth,
                                    height: WindowWidth,
                                }}
                            />
                        )}
                        { post.text === '' ||
                            <Markdown style={styles.markdownStyle}>{post.text}</Markdown>
                        }
                        { this.renderButtonsIfSelected(post) }
                    </TouchableOpacity>
                </View>
            );
        }
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
                navigation={this.props.navigation}
                onSavePost={this.props.onSavePost} />
        );
    }

    private renderListFooter = () => {
        return (
            <View style={{
                height: 100,
            }}
            />
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
