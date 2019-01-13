import * as React from 'react';
import {
    View,
    FlatList,
    RefreshControl,
    StyleSheet,
    SafeAreaView,
    LayoutAnimation,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { Post, Author } from '../models/Post';
import { FeedHeader } from './FeedHeader';
import { Colors } from '../styles';
import { StatusBarView } from './StatusBarView';
import { Settings } from '../models/Settings';
import { NavigationHeader } from './NavigationHeader';
import * as AreYouSureDialog from './AreYouSureDialog';
import { Feed } from '../models/Feed';
import { CardContainer } from '../containers/CardContainer';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onSavePost: (post: Post) => void;
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
}

// TODO YourFeed is having too many responsabilities
export type YourFeedVariant = 'favorite' | 'news' | 'your' | 'feed';

export class YourFeed extends React.PureComponent<DispatchProps & StateProps, YourFeedState> {
    public state: YourFeedState = {
        selectedPost: null,
        isRefreshing: false,
    };

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
                        <CardContainer
                            post={obj.item}
                            isSelected={this.isPostSelected(obj.item)}
                            navigate={this.props.navigation.navigate}
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

    private onRefresh() {
        this.setState({
            isRefreshing: true,
        });
        this.props.onRefreshPosts(this.props.feeds);
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

    private renderListHeader = () => {
        switch (this.props.yourFeedVariant) {
            case 'your': {
                return (
                    <FeedHeader
                        navigation={this.props.navigation}
                        onSavePost={this.props.onSavePost}
                    />
                );
            }
            case 'favorite': {
                return (
                    <NavigationHeader
                        leftButtonText=''
                        title='Favorites'
                    />
                );
            }
            case 'news': {
                return (
                    <NavigationHeader
                        leftButtonText=''
                        title='News'
                    />
                );
            }
            default: {
                return null;
            }
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
