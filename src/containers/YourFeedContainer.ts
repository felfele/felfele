import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { Post } from '../models/Post';
import { Actions, AsyncActions } from '../actions/Actions';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = state.localPosts.toArray();
    const filteredPosts = posts;

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: state.feeds.filter(feed => feed != null && feed.followed === true).toArray(),
        knownFeeds: state.feeds.filter(feed => feed != null && feed.followed !== true).toArray(),
        settings: state.settings,
        yourFeedVariant: 'your',
        isOwnFeed: false,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            // workaround to finish refresh
            dispatch(Actions.timeTick());
        },
        onSavePost: (post: Post) => {
            dispatch(AsyncActions.createPost(post));
        },
        onUnfollowFeed: (feed: Feed) => {
            // do nothing
        },
        onFollowFeed: (feed: Feed) => {
            // do nothing
        },
        onToggleFavorite: (feedUrl: string) => {
            // do nothing
        },
    };
};

export const YourFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
