import { connect } from 'react-redux';
import { AppState } from '../models/AppState';
import { Actions, AsyncActions } from '../actions/Actions';
import { StateProps, DispatchProps, FeedInfo } from '../components/FeedInfo';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    // this fixes the case when navigating back from an opened Feed
    updateNavParam(state.feeds, ownProps.navigation);

    return {
        feed: ownProps.navigation.state.params.feed,
        navigation: ownProps.navigation,
    };
};

const updateNavParam = (feeds: Feed[], navigation: any) => {
    const updatedFeed = feeds.find(feed => feed.feedUrl === navigation.state.params.feed.feedUrl);
    if (updatedFeed != null && updatedFeed.followed !== navigation.state.params.feed.followed) {
        navigation.setParams({ feed: updatedFeed });
    }
};

const mapDispatchToProps = (dispatch, ownProps): DispatchProps => {
    return {
        onAddFeed: (feed: Feed) => {
            dispatch(Actions.addFeed(feed));
            dispatch(AsyncActions.downloadPostsFromFeeds([feed]));
        },
        onRemoveFeed: (feed: Feed) => {
            dispatch(Actions.removeFeed(feed));
            dispatch(AsyncActions.downloadFollowedFeedPosts());
        },
        onUnfollowFeed: (feed: Feed) => {
            dispatch(Actions.unfollowFeed(feed));
        },
    };
};

export const EditFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(FeedInfo);
