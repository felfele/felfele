import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { AsyncActions, Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const feedUrl = ownProps.navigation.state.params.feedUrl;
    const selectedFeeds = state.feeds.filter(feed => feed != null && feed.feedUrl === feedUrl);
    const posts = state.rssPosts.concat(state.localPosts)
        .filter(post => post != null && post.author != null && post.author.uri === feedUrl);

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
