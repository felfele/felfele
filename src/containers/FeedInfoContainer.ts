import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { Actions, AsyncActions } from '../actions/Actions';
import { StateProps, DispatchProps, FeedInfo } from '../components/FeedInfo';
import { Feed } from '../models/Feed';
import { TypedNavigation, Routes } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    // this fixes rerendering after unfollow
    updateNavParam(state.feeds, ownProps.navigation);
    const navParamFeed = ownProps.navigation.getParam<'FeedInfo', 'feed'>('feed');
    const isKnownFeed = state.feeds.find(feed => navParamFeed.feedUrl === feed.feedUrl) != null;

    return {
        feed: navParamFeed,
        swarmGateway: state.settings.swarmGatewayAddress,
        navigation: ownProps.navigation,
        isKnownFeed: isKnownFeed,
    };
};

const updateNavParam = (feeds: Feed[], navigation: TypedNavigation) => {
    const feedUrl = navigation.getParam<'FeedInfo', 'feed'>('feed').feedUrl;
    const isFollowed = navigation.getParam<'FeedInfo', 'feed'>('feed').followed;

    const updatedFeed = feeds.find(feed => feed.feedUrl === feedUrl);
    if (updatedFeed != null && updatedFeed.followed !== isFollowed) {
        navigation.setParams<'FeedInfo'>({ feed: updatedFeed });
    }
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onAddFeed: (feed: Feed) => {
            dispatch(AsyncActions.addFeed(feed));
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
