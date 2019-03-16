import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { AsyncActions, Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';

export const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const feedUrl = ownProps.navigation.state.params.feed.feedUrl;
    const feedName = ownProps.navigation.state.params.feed.name;
    const posts: Post[] = [];
    return {
        onBack: () => ownProps.navigation.goBack(null),
        navigation: ownProps.navigation,
        feedUrl,
        feedName,
        posts,
        feeds: [ownProps.navigation.state.params.feed],
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
