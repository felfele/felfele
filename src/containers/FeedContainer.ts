import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { AsyncActions, Actions } from '../actions/Actions';
import { Post } from '../models/Post';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = state.rssPosts.concat(state.localPosts)
        .filter(post => post != null && post.author != null && post.author.uri === ownProps.navigation.state.params.author.uri)
        .toArray();

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: state.feeds.toArray(),
        settings: state.settings,
        displayFeedHeader: false,
        notOwnFeed: state.author.uri !== ownProps.navigation.state.params.author.uri,
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
        onUnfollowFeed: (feedUrl: string) => {
            dispatch(Actions.removeFeed(feedUrl));
        },
        onToggleFavorite: (feedUrl: string) => {
            dispatch(Actions.toggleFeedFavorite(feedUrl));
        },
    };
};

export const FeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
