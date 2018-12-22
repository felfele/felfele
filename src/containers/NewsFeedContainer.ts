import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { RSSPostManager } from '../RSSPostManager';
import { AsyncActions, Actions } from '../actions/Actions';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = state.rssPosts.toArray();
    const filteredPosts = posts;

    RSSPostManager.setContentFilters(state.contentFilters.toArray());

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: state.feeds.toArray(),
        knownFeeds: state.knownFeeds.toArray(),
        settings: state.settings,
        yourFeedVariant: 'news',
        notOwnFeed: false,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: () => {
            dispatch(AsyncActions.downloadPosts());
        },
        onDeletePost: (post: Post) => {
            // do nothing
        },
        onSavePost: (post: Post) => {
            // do nothing
        },
        onSharePost: (post: Post) => {
            // do nothing
        },
        onUnfollowFeed: (feed: Feed) => {
            // do nothing
        },
        onAddFeed: (feed: Feed) => {
            // do nothing
        },
        onToggleFavorite: (feedUrl: string) => {
            dispatch(Actions.toggleFeedFavorite(feedUrl));
        },
    };
};

export const NewsFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
