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
    Platform,
    SafeAreaView,
    LayoutAnimation,
    ActivityIndicator,
} from 'react-native';
import Markdown from 'react-native-easy-markdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { Post, getAuthorImageUri, Author } from '../models/Post';
import { ImageData, calculateImageDimensions } from '../models/ImageData';
import { NetworkStatus } from '../NetworkStatus';
import { DateUtils } from '../DateUtils';
import { FeedHeader } from './FeedHeader';
import { Utils } from '../Utils';
import { isSwarmLink } from '../Swarm';
import { Colors, DefaultStyle } from '../styles';
import { TouchableView } from './TouchableView';
import { ImageView } from './ImageView';
import { Debug } from '../Debug';
import { StatusBarView } from './StatusBarView';
import { Settings } from '../models/Settings';
import { NavigationHeader } from './NavigationHeader';
import * as AreYouSureDialog from './AreYouSureDialog';
import { Feed } from '../models/Feed';

const WindowWidth = Dimensions.get('window').width;

export interface DispatchProps {
    onRefreshPosts: () => void;
    onDeletePost: (post: Post) => void;
    onSavePost: (post: Post) => void;
    onSharePost: (post: Post) => void;
    onUnfollowFeed: (feed: Feed) => void;
    onAddFeed: (feed: Feed) => void;
    onToggleFavorite: (feedUrl: string) => void;
}

export interface StateProps {
    navigation: any;
    posts: Post[];
    feeds: Feed[];
    visitedFeeds: Feed[];
    settings: Settings;
    displayFeedHeader: boolean;
    notOwnFeed: boolean;
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
            this.setState({
                isRefreshing: false,
            });
        }
    }

    public render() {
        const isFollowedFeed = this.props.navigation.state.params != null &&
            this.props.feeds.find(feed => feed.feedUrl === this.props.navigation.state.params.author.uri) != null;
        const displayRightButtons = this.props.notOwnFeed;
        return (
            <SafeAreaView
                style={{
                    flexDirection: 'column',
                    padding: 0,
                    flex: 1,
                    height: '100%',
                    opacity: 0.96,
                }}
            >
                <StatusBarView
                    backgroundColor={Colors.BACKGROUND_COLOR}
                    hidden={false}
                    translucent={false}
                    barStyle='dark-content'
                    networkActivityIndicatorVisible={true}
                />
                {!this.props.displayFeedHeader &&
                <NavigationHeader
                    leftButtonText='Back'
                    onPressLeftButton={() => this.props.navigation.goBack(null)}
                    rightButtonText1={this.props.notOwnFeed ? <Icon
                        name={isFollowedFeed ? 'link-variant-off' : 'link-variant'}
                        size={20}
                        color={Colors.LIGHT_GRAY}
                    /> : undefined}
                    rightButtonText2={this.props.notOwnFeed && isFollowedFeed ? <MaterialIcon
                        name={'favorite'}
                        size={20}
                        color={this.isFavorite() ? Colors.DEFAULT_ACTION_COLOR : Colors.LIGHTER_GRAY}
                    /> : undefined}
                    onPressRightButton1={async () => this.props.notOwnFeed && await this.onFollowPressed(this.props.navigation.state.params.author)}
                    onPressRightButton2={async () => this.props.notOwnFeed && isFollowedFeed && await this.props.onToggleFavorite(this.props.navigation.state.params.author.uri)}
                    title={this.props.navigation.state.params ? this.props.navigation.state.params.author.name : 'Favorites'}
                />}
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
                            onRefresh={() => this.onRefresh() }
                            progressViewOffset={HeaderOffset}
                            style={styles.refreshControl}
                        />
                    }
                    style={{
                        backgroundColor: Colors.BACKGROUND_COLOR,
                    }}
                />
            </SafeAreaView>
        );
    }

    private isFavorite(): boolean {
        const feed = this.props.feeds.find(value => value.feedUrl === this.props.navigation.state.params.author.uri);
        return feed != null && !!feed.favorite;
    }
    private onConnectionStateChange(connected) {
        this.setState({
            isOnline: connected,
        });
    }

    private onRefresh() {
        this.setState({
            isRefreshing: true,
        });
        this.props.onRefreshPosts();
    }

    private async onFollowPressed(author: Author) {
        const followedFeed = this.props.feeds.find(feed => feed.feedUrl === author.uri);
        if (followedFeed != null) {
            const confirmUnfollow = await AreYouSureDialog.show('Are you sure you want to unfollow?');
            if (confirmUnfollow) {
                this.props.onUnfollowFeed(followedFeed);
            }
        } else {
            const visitedFeed = this.props.visitedFeeds.find(feed => feed.feedUrl === author.uri);
            if (visitedFeed != null) {
                this.props.onAddFeed(visitedFeed);
            }
        }
    }

    private async openPost(post: Post) {
        if (post.link) {
            if (!isSwarmLink(post.link)) {
                await Linking.openURL(post.link);
            }
        }
    }

    private isPostSelected(post: Post) {
        return this.state.selectedPost && this.state.selectedPost._id === post._id;
    }

    private togglePostSelection(post: Post) {
        LayoutAnimation.easeInEaseOut();
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
                { text: 'Cancel', onPress: () => Debug.log('Cancel Pressed'), style: 'cancel' },
                { text: 'OK', onPress: async () => await this.props.onDeletePost(post) },
            ],
            { cancelable: false }
        );
    }

    private renderButtonsIfSelected(post: Post) {
        const iconSize = 20;
        const likeIconName = post.liked === true ? 'heart' : 'heart-outline';
        const shareIconName = post.link != null ? 'share' : 'share-outline';
        const ActionIcon = (props) => <Icon name={props.name} size={iconSize} color={Colors.DARK_GRAY} />;
        if (this.isPostSelected(post)) {
            return (
                <View style={styles.itemImageContainer}>
                    <TouchableView style={styles.like} onPress={() => post.liked = true}>
                        <ActionIcon name={likeIconName}/>
                    </TouchableView>
                    <TouchableView style={styles.comment} onPress={() => alert('go comment!')}>
                        <ActionIcon name='comment-multiple-outline'/>
                    </TouchableView>
                    <TouchableView style={styles.share} onPress={() => this.onDeleteConfirmation(post)}>
                        <ActionIcon name='trash-can-outline'/>
                    </TouchableView>
                    <TouchableView style={styles.share}>
                        {/* <ActionIcon name='playlist-edit'/> */}
                    </TouchableView>
                    <TouchableView style={styles.share} onPress={() => this.props.onSharePost(post)}>
                        { post.isUploading === true
                            ? <ActivityIndicator color={Colors.DARK_GRAY} />
                            : <ActionIcon name={shareIconName}/>
                        }
                    </TouchableView>
                </View>
            );
        }
        return [];
    }

    private renderCardTopIcon(post: Post) {
        if (post.author) {
            const imageUri = getAuthorImageUri(post.author);
            const imageSource = imageUri === ''
             ? require('../../images/user_circle.png')
             : { uri: imageUri };
            return (
                <Image source={imageSource} style={DefaultStyle.favicon} />
            );
        } else {
            return null;
        }
    }

    private renderCardTop(post: Post) {
        const printableTime = DateUtils.printableElapsedTime(post.createdAt) + ' ago';
        const username = post.author ? post.author.name : 'Space Cowboy';
        const url = post.link || '';
        const hostnameText = url === '' ? '' : ' -  ' + Utils.getHumanHostname(url);
        return (
            <TouchableOpacity
                onPress={() => this.props.navigation.navigate('Feed', { author: post.author && post.author })}
                style={styles.infoContainer}
            >
                { this.renderCardTopIcon(post) }
                <View style={styles.usernameContainer}>
                    <Text style={styles.username} numberOfLines={1}>{username}</Text>
                    <Text style={styles.location}>{printableTime}{hostnameText}</Text>
                </View>
            </TouchableOpacity>
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
                testID={'YourFeed/Post' + post._id}
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
                    testID={'YourFeed/Post' + post._id}
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
                        {post.images.map((image, index) => {
                            const [width, height] = this.calculateImageDimensions(image, WindowWidth);
                            return (
                                <ImageView
                                    key={image.uri || '' + index}
                                    source={image}
                                    style={{
                                        width: width,
                                        height: height,
                                    }}
                                />
                            );
                        })}
                        { post.text === '' ||
                            <Markdown style={styles.markdownStyle}>{post.text}</Markdown>
                        }
                        { this.renderButtonsIfSelected(post) }
                    </TouchableOpacity>
                </View>
            );
        }
    }

    private calculateImageDimensions = (image: ImageData, maxWidth: number): number[] => {
        if (this.props.settings.showSquareImages) {
            return [maxWidth, maxWidth];
        }
        return calculateImageDimensions(image, maxWidth);
    }

    private renderListHeader = () => {
        if (this.props.displayFeedHeader) {
            return (
                <FeedHeader
                    navigation={this.props.navigation}
                    onSavePost={this.props.onSavePost}
                />
            );
        } else {
            return null;
        }
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
    usernameContainer: {justifyContent: 'center', flexDirection: 'column'},
    location: {fontSize: 10, color: 'gray'},
    itemImageContainer: {flexDirection: 'row', height: 40, alignSelf: 'stretch', marginLeft: 5, marginTop: 5, justifyContent: 'space-evenly'},
    like: {marginHorizontal: 20, marginVertical: 5, marginLeft: 5},
    comment: {marginHorizontal: 20, marginVertical: 5},
    share: {marginHorizontal: 20, marginVertical: 5},
    edit: {marginHorizontal: 20, marginVertical: 5},
    likeCount: {flexDirection: 'row', alignItems: 'center', marginLeft: 2},
    commentItem: {fontSize: 10 , color: 'rgba(0, 0, 0, 0.5)', marginTop: 5},
    captionContainer: {marginTop: 2 , flexDirection: 'row', alignItems: 'center'},
    captionText: { fontSize: 12, fontWeight: 'bold' },
    dateText: {fontSize: 8 , color: 'rgba(0, 0, 0, 0.5)', marginTop: 5},
    seperator: {height: 1, alignSelf: 'stretch', marginHorizontal: 10, backgroundColor: 'rgba(0, 0, 0, 0.2)'},
    hashTag: {fontStyle: 'italic', color: 'blue'},
    footer: {marginVertical: 5, alignSelf: 'stretch', marginHorizontal: 20, flexDirection: 'column'},
    username: {fontWeight: 'bold', color: Colors.DARK_GRAY},
    text: {fontSize: 12, color: Colors.DARK_GRAY},
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
