import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { AsyncActions, Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { getFeedPosts, getYourPosts } from '../selectors/selectors';
import { TypedNavigation } from '../helpers/navigation';

export const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const feedUrl = ownProps.navigation.getParam<'Feed', 'feedUrl'>('feedUrl');
    const feedName = ownProps.navigation.getParam<'Feed', 'name'>('name');

    const isOwnFeed = feedName === state.author.name;
    const hasOwnFeed = state.ownFeeds.length > 0;
    const ownFeed = hasOwnFeed ? state.ownFeeds[0] : undefined;
    const selectedFeeds = isOwnFeed
        ? hasOwnFeed
            ? [ownFeed!]
            : []
        : state.feeds.filter(feed => feed != null && feed.feedUrl === feedUrl)
        ;
    // Note: this is a moderately useful selector (recalculated if another feedUrl is opened (cache size == 1))
    // see https://github.com/reduxjs/reselect/blob/master/README.md#accessing-react-props-in-selectors
    const feedPosts = getFeedPosts(state, feedUrl);
    const ownPosts = getYourPosts(state);
    const posts = isOwnFeed
        ? ownPosts
        : feedPosts
        ;
    return {
        onBack: () => ownProps.navigation.popToTop(),
        navigation: ownProps.navigation,
        feedUrl,
        feedName,
        posts,
        feeds: selectedFeeds,
        isOwnFeed,
        gatewayAddress: state.settings.swarmGatewayAddress,
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
        onRemoveFeed: (feed: Feed) => {
            dispatch(Actions.removeFeed(feed));
        },
    };
};

export const FeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedView);
