import { connect } from 'react-redux';
import { AppState } from '../models/AppState';
import { StateProps, DispatchProps } from '../components/FavoritesFeedView';
import { AsyncActions } from '../actions/Actions';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { FavoritesFeedView } from '../components/FavoritesFeedView';

const isPostFromFavoriteFeed = (post: Post, favoriteFeeds: Feed[]): boolean => {
    return favoriteFeeds.find(feed => {
        return feed != null && post.author != null &&
            feed.feedUrl === post.author.uri;
    }) != null;
};

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const favoriteFeeds = state.feeds.filter(feed => feed != null && feed.favorite === true);
    const posts = state.rssPosts
        .filter(post => post != null && isPostFromFavoriteFeed(post, favoriteFeeds));

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: favoriteFeeds,
        settings: state.settings,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
    };
};

export const FavoritesContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(FavoritesFeedView);
