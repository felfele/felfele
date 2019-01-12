import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { AsyncActions, Actions } from '../actions/Actions';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const authorUri = ownProps.navigation.state.params.author.uri;
    const selectedFeeds = state.feeds.filter(feed =>
        feed != null && feed.followed === true && feed.feedUrl === authorUri).toArray();
    const posts = state.rssPosts.concat(state.localPosts)
        .filter(post => post != null && post.author != null && post.author.uri === authorUri)
        .toArray();

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: selectedFeeds,
        knownFeeds: state.feeds.filter(feed => feed != null && feed.followed !== true).toArray(),
        settings: state.settings,
        yourFeedVariant: 'feed',
        isOwnFeed: state.author.uri === ownProps.navigation.state.params.author.uri,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
        onSavePost: (post: Post) => {
            // do nothing
        },
        onUnfollowFeed: (feed: Feed) => {
            dispatch(Actions.unfollowFeed(feed));
        },
        onFollowFeed: (feed: Feed) => {
            dispatch(Actions.followFeed(feed));
        },
        onToggleFavorite: (feedUrl: string) => {
            dispatch(Actions.toggleFeedFavorite(feedUrl));
        },
    };
};

export const FeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
