import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { LocalPostManager } from '../LocalPostManager';
import { Post } from '../models/Post';
import { Actions, AsyncActions } from '../actions/Actions';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = LocalPostManager.getAllPosts();
    const filteredPosts = posts;

    return {
        navigation: ownProps.navigation,
        postManager: LocalPostManager,
        posts: filteredPosts,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: () => {
            // workaround to finish refresh
            dispatch(Actions.timeTickAction());
        },
        onDeletePost: (post: Post) => {
            dispatch(AsyncActions.removePost(post));
        },
    };
};

export const YourFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
