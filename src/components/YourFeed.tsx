import * as React from 'react';
import {
    Linking,
    View,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Platform,
    SafeAreaView,
    LayoutAnimation,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { Post, Author } from '../models/Post';
import { NetworkStatus } from '../NetworkStatus';
import { FeedHeader } from './FeedHeader';
import { isSwarmLink } from '../Swarm';
import { Colors } from '../styles';
import { Debug } from '../Debug';
import { StatusBarView } from './StatusBarView';
import { Settings } from '../models/Settings';
import { NavigationHeader } from './NavigationHeader';
import * as AreYouSureDialog from './AreYouSureDialog';
import { Feed } from '../models/Feed';
import { Card } from './Card';

export interface DispatchProps {
    onRefreshPosts: () => void;
    onDeletePost: (post: Post) => void;
    onSavePost: (post: Post) => void;
    onSharePost: (post: Post) => void;
    onFollowFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;
    onToggleFavorite: (feedUrl: string) => void;
}

export interface StateProps {
    navigation: any;
    posts: Post[];
    feeds: Feed[];
    knownFeeds: Feed[];
    settings: Settings;
    yourFeedVariant: YourFeedVariant;
    isOwnFeed: boolean;
}

interface YourFeedState {
    selectedPost: Post | null;
    isRefreshing: boolean;
    isOnline: boolean;
    currentTime: number;
}

// TODO YourFeed is having too many responsabilities
export type YourFeedVariant = 'favorite' | 'news' | 'your' | 'feed';

export class YourFeed extends React.PureComponent<DispatchProps & StateProps, YourFeedState> {
    constructor(props) {
        super(props);
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
                <this.NavHeader {...this.props} onFollowPressed={this.onFollowPressed} isFavorite={this.isFavorite}/>
                <FlatList
                    ListHeaderComponent={this.renderListHeader}
                    ListFooterComponent={this.renderListFooter}
                    data={this.props.posts}
                    renderItem={(obj) => (
                        <Card
                            post={obj.item}
                            isSelected={this.isPostSelected(obj.item)}
                            navigate={this.props.navigation.navigate}
                            onDeleteConfirmation={this.onDeleteConfirmation}
                            onSharePost={this.props.onSharePost}
                            openPost={this.openPost}
                            togglePostSelection={this.togglePostSelection}
                            showSquareImages={this.props.settings.showSquareImages}
                        />
                    )}
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

    private NavHeader(props: DispatchProps & StateProps &
        { onFollowPressed: (author: Author) => void, isFavorite: () => boolean }) {
        const navParams = props.navigation.state.params;
        switch (props.yourFeedVariant) {
            case 'favorite': {
                return (
                    <NavigationHeader
                        leftButtonText=' '
                        title={navParams ? navParams.author.name : 'Favorites'}
                    />
                );
            }
            case 'feed': {
                const isFollowedFeed = navParams != null &&
                    props.feeds.find(feed => feed.feedUrl === navParams.author.uri) != null;
                return (
                    <NavigationHeader
                        onPressLeftButton={() => props.navigation.goBack(null)}
                        rightButtonText1={!props.isOwnFeed ? <Icon
                            name={isFollowedFeed ? 'link-variant-off' : 'link-variant'}
                            size={20}
                            color={Colors.DARK_GRAY}
                        /> : undefined}
                        rightButtonText2={!props.isOwnFeed ? <MaterialIcon
                            name={'favorite'}
                            size={20}
                            color={isFollowedFeed
                                ? props.isFavorite() ? Colors.BRAND_RED : Colors.DARK_GRAY
                                : 'transparent'
                            }
                        /> : undefined}
                        onPressRightButton1={async () => !props.isOwnFeed && await props.onFollowPressed(navParams.author)}
                        onPressRightButton2={() => !props.isOwnFeed && isFollowedFeed && props.onToggleFavorite(navParams.author.uri)}
                        title={navParams ? navParams.author.name : 'Favorites'}
                    />
                );
            }
            default: {
                return <View/>;
            }
        }
    }

    private isFavorite = (): boolean => {
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

    private onFollowPressed = async (author: Author) => {
        const followedFeed = this.props.feeds.find(feed => feed.feedUrl === author.uri);
        if (followedFeed != null) {
            await this.unfollowFeed(followedFeed);
        } else {
            this.followFeed(author);
        }
    }

    private unfollowFeed = async (feed: Feed) => {
        const confirmUnfollow = await AreYouSureDialog.show('Are you sure you want to unfollow?');
        if (confirmUnfollow) {
            this.props.onUnfollowFeed(feed);
        }
    }

    private followFeed = (author: Author) => {
        const knownFeed = this.props.knownFeeds.find(feed => feed.feedUrl === author.uri);
        if (knownFeed != null) {
            this.props.onFollowFeed(knownFeed);
        }
    }

    private openPost = async (post: Post) => {
        if (post.link) {
            if (!isSwarmLink(post.link)) {
                await Linking.openURL(post.link);
            }
        }
    }

    private isPostSelected = (post: Post): boolean => {
        return this.state.selectedPost != null && this.state.selectedPost._id === post._id;
    }

    private togglePostSelection = (post: Post) => {
        LayoutAnimation.easeInEaseOut();
        if (this.isPostSelected(post)) {
            this.setState({ selectedPost: null });
        } else {
            this.setState({ selectedPost: post });
        }
    }

    private onDeleteConfirmation = (post: Post) => {
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

    private renderListHeader = () => {
        if (this.props.yourFeedVariant === 'news' || this.props.yourFeedVariant === 'your') {
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

const styles = StyleSheet.create({
    refreshControl: { },
});
