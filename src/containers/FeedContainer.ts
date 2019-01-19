import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { AsyncActions, Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const authorUri = ownProps.navigation.state.params.author.uri;
    const selectedFeeds = state.feeds.filter(feed => feed != null && feed.feedUrl === authorUri);
    const posts = state.rssPosts.concat(state.localPosts)
        .filter(post => post != null && post.author != null && post.author.uri === authorUri);

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: selectedFeeds,
        settings: state.settings,
        isOwnFeed: state.author.uri === ownProps.navigation.state.params.author.uri,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
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
)(FeedView);
