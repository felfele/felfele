import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { AsyncActions, Actions } from '../actions/Actions';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';

const isPostFromFavoriteFeed = (post: Post, favoriteFeeds: Feed[]): boolean => {
    return favoriteFeeds.find(feed => {
        return feed != null && post.author != null &&
            feed.feedUrl === post.author.uri;
    }) != null;
};

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const favoriteFeeds = state.feeds.toArray().filter(feed => feed != null && feed.favorite === true);
    const posts = state.rssPosts
        .filter(post => post != null && isPostFromFavoriteFeed(post, favoriteFeeds))
        .toArray();

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: state.feeds.filter(feed => feed != null && feed.followed === true).toArray(),
        knownFeeds: state.feeds.filter(feed => feed != null && feed.followed !== true).toArray(),
        settings: state.settings,
        yourFeedVariant: 'favorite',
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

export const FavoritesContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
