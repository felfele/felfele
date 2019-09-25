import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { Actions } from '../actions/Actions';
import { AsyncActions } from '../actions/asyncActions';
import { StateProps, DispatchProps, FeedInfo } from '../components/FeedInfo';
import { Feed } from '../models/Feed';
import { TypedNavigation } from '../helpers/navigation';
import { RSSFeedInfo } from '../ui/screens/rss-feed/RSSFeedInfo';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    // this is needed because initally we receive the feed as a navigation param, and when we follow it,
    // it gets added to the state, and further changes to it are not reflected in the original object
    const navParamFeed = getFeedToOpen(state.feeds, ownProps.navigation);
    const isKnownFeed = state.feeds.find(feed => navParamFeed.feedUrl === feed.feedUrl) != null;
    const profile = {
        name: state.author.name,
        image: state.author.image,
        identity: state.author.identity!,
    };

    return {
        feed: navParamFeed,
        swarmGateway: state.settings.swarmGatewayAddress,
        navigation: ownProps.navigation,
        isKnownFeed: isKnownFeed,
        profile,
    };
};

const getFeedToOpen = (feeds: Feed[], navigation: TypedNavigation) => {
    const feedUrl = navigation.getParam<'FeedInfo', 'feed'>('feed').feedUrl;
    const isFollowed = navigation.getParam<'FeedInfo', 'feed'>('feed').followed;

    const updatedFeed = feeds.find(feed => feed.feedUrl === feedUrl && feed.followed !== isFollowed);
    if (updatedFeed != null) {
        return updatedFeed;
    } else {
        return navigation.getParam<'FeedInfo', 'feed'>('feed');
    }
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
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

export const RSSFeedInfoContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(RSSFeedInfo);
