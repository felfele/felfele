import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { AsyncActions } from '../actions/Actions';
import { Post } from '../models/Post';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = state.rssPosts
        .filter(post => post != null && post.author != null && post.author.uri === state.currentFeed.)
        .toArray();

    return {
        navigation: ownProps.navigation,
        posts: posts,
        settings: state.settings,
        displayFeedHeader: false,
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
    };
};

export const FeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
