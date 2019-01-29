import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { AsyncActions, Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { getFeedPosts } from '../selectors/selectors';

export const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const feedUrl = ownProps.navigation.state.params.feedUrl;
    const selectedFeeds = state.feeds.filter(feed => feed != null && feed.feedUrl === feedUrl);
    // Note: this is a moderately useful selector (recalculated if another feedUrl is opened (cache size == 1))
    // see https://github.com/reduxjs/reselect/blob/master/README.md#accessing-react-props-in-selectors
    const posts = getFeedPosts(state, feedUrl);

    return {
        onBack: () => ownProps.navigation.goBack(null),
        navigation: ownProps.navigation,
        feedUrl: feedUrl,
        feedName: ownProps.navigation.state.params.name,
        posts: posts,
        feeds: selectedFeeds,
        settings: state.settings,
        isOwnFeed: state.author.uri === feedUrl,
    };
};

export const mapDispatchToProps = (dispatch): DispatchProps => {
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
