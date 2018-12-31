import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { RSSPostManager } from '../RSSPostManager';
import { AsyncActions, Actions } from '../actions/Actions';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';

const isPostFromFollowedFeed = (post: Post, followedFeeds: Feed[]): boolean => {
    return followedFeeds.find(feed => {
        return feed != null && post.author != null &&
            feed.feedUrl === post.author.uri;
    }) != null;
};

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const followedFeeds = state.feeds.toArray().filter(feed => feed != null && feed.followed === true);
    const posts = state.rssPosts
        .filter(post => post != null && isPostFromFollowedFeed(post, followedFeeds))
        .toArray();
    const filteredPosts = posts;

    RSSPostManager.setContentFilters(state.contentFilters.toArray());

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: state.feeds.filter(feed => feed != null && feed.followed === true).toArray(),
        knownFeeds: state.feeds.filter(feed => feed != null && feed.followed !== true).toArray(),
        settings: state.settings,
        yourFeedVariant: 'news',
        isOwnFeed: false,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: () => {
            dispatch(AsyncActions.downloadPosts());
        },
        onDeletePost: (post: Post) => {
            // do nothing
        },
        onSavePost: (post: Post) => {
            // do nothing
        },
        onSharePost: (post: Post) => {
            // do nothing
        },
        onUnfollowFeed: (feed: Feed) => {
            // do nothing
        },
        onFollowFeed: (feed: Feed) => {
            // do nothing
        },
        onToggleFavorite: (feedUrl: string) => {
            dispatch(Actions.toggleFeedFavorite(feedUrl));
        },
    };
};

export const NewsFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
