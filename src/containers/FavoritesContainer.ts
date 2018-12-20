import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { AsyncActions, Actions } from '../actions/Actions';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { List } from 'immutable';

const isPostFromFavoriteFeed = (post: Post, feeds: List<Feed>): boolean => {
    const favoriteFeeds = feeds.filter(feed => feed != null && feed.favorite === true);
    return favoriteFeeds.find(feed => feed != null &&  post.author != null && feed.feedUrl === post.author.uri) != null;
};

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = state.rssPosts
        .filter(post => post != null && isPostFromFavoriteFeed(post, state.feeds))
        .toArray();

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: state.feeds.toArray(),
        settings: state.settings,
        displayFeedHeader: false,
        notOwnFeed: false,
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
        onUnfollowFeed: (feedUrl: string) => {
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
