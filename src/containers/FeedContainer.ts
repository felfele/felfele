import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { AsyncActions, Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { getFeedPosts, getYourPosts } from '../selectors/selectors';

export const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const feedUrl = ownProps.navigation.state.params.feedUrl;
    const selectedFeeds = state.feeds.filter(feed => feed != null && feed.feedUrl === feedUrl);
    // TODO: we should have here state.ownFeeds.find(feed => feed.url === feedUrl) != null,
    // but author.uri is empty, and the feedUrl from navparams is from post.author.uri (not real feedUrl)
    // For the same reason feeds/selectedFeeds is empty (errounously)
    const isOwnFeed = state.author.uri === feedUrl;
    // Note: this is a moderately useful selector (recalculated if another feedUrl is opened (cache size == 1))
    // see https://github.com/reduxjs/reselect/blob/master/README.md#accessing-react-props-in-selectors
    const posts = isOwnFeed ? getYourPosts(state) : getFeedPosts(state, feedUrl);
    return {
        onBack: () => ownProps.navigation.goBack(null),
        navigation: ownProps.navigation,
        feedUrl: feedUrl,
        feedName: ownProps.navigation.state.params.name,
        posts: posts,
        // HACK
        feeds: selectedFeeds.length === 0 ? [state.ownFeeds[0]] : selectedFeeds,
        isOwnFeed: isOwnFeed,
    };
};

export const mapDispatchToProps = (dispatch: any): DispatchProps => {
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

export const FeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedView);
