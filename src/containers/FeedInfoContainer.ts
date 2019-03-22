import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { Actions, AsyncActions } from '../actions/Actions';
import { StateProps, DispatchProps, FeedInfo } from '../components/FeedInfo';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    // this fixes rerendering after unfollow
    updateNavParam(state.feeds, ownProps.navigation);
    const navParamFeed = ownProps.navigation.state.params.feed;
    const isKnownFeed = state.feeds.find(feed => navParamFeed.feedUrl === feed.feedUrl) != null;

    return {
        feed: navParamFeed,
        swarmGateway: state.settings.swarmGatewayAddress,
        navigation: ownProps.navigation,
        isKnownFeed: isKnownFeed,
    };
};

const updateNavParam = (feeds: Feed[], navigation: any) => {
    const updatedFeed = feeds.find(feed => feed.feedUrl === navigation.state.params.feed.feedUrl);
    if (updatedFeed != null && updatedFeed.followed !== navigation.state.params.feed.followed) {
        navigation.setParams({ feed: updatedFeed });
    }
};

const mapDispatchToProps = (dispatch: any, ownProps: { navigation: any }): DispatchProps => {
    return {
        onAddFeed: (feed: Feed) => {
            dispatch(Actions.addFeed(feed));
            dispatch(AsyncActions.downloadPostsFromFeeds([feed]));
        },
        onRemoveFeed: (feed: Feed) => {
            dispatch(Actions.removeFeed(feed));
            dispatch(AsyncActions.downloadFollowedFeedPosts());
            ownProps.navigation.pop(2);
        },
        onUnfollowFeed: (feed: Feed) => {
            dispatch(Actions.unfollowFeed(feed));
        },
    };
};

export const EditFeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedInfo);
