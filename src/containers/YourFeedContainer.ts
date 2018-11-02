import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { Post } from '../models/Post';
import { Actions, AsyncActions } from '../actions/Actions';
import { isPostFeedUrl } from '../PostFeed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = state.localPosts.toArray();
    const filteredPosts = posts;

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: () => {
            // workaround to finish refresh
            dispatch(Actions.timeTick());
        },
        onDeletePost: (post: Post) => {
            dispatch(AsyncActions.removePost(post));
        },
        onSavePost: (post: Post) => {
            dispatch(AsyncActions.createPost(post));
        },
        onSharePost: (post: Post) => {
            if (post.link != null) {
                return;
            }
            dispatch(AsyncActions.sharePost(post));
        },
    };
};

export const YourFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
