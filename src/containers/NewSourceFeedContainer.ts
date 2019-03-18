import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { AsyncActions, Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { getFeedPosts } from '../selectors/selectors';

export const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const feed = ownProps.navigation.state.params.feed;
    const addedFeed = state.feeds.find(value => value.feedUrl === feed.feedUrl);
    const feeds = addedFeed != null ? [ addedFeed ] : [ feed ];
    const feedName = ownProps.navigation.state.params.feed.name;
    const posts = getFeedPosts(state, feed.feedUrl);
    return {
        onBack: () => ownProps.navigation.goBack(),
        navigation: ownProps.navigation,
        feedUrl: feed.feedUrl,
        feedName,
        posts,
        feeds: feeds,
        isOwnFeed: false,
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
            dispatch(Actions.addFeed(feed));
            dispatch(Actions.followFeed(feed));
        },
        onToggleFavorite: (feedUrl: string) => {
            dispatch(Actions.toggleFeedFavorite(feedUrl));
        },
    };
};

export const NewsSourceFeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedView);
