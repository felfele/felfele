import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeed } from '../components/YourFeed';
import { RSSPostManager } from '../RSSPostManager';
import { Actions, AsyncActions } from '../actions/Actions';
import { Post } from '../models/Post';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = state.rssPosts.toArray();
    const filteredPosts = posts;

    RSSPostManager.setContentFilters(state.contentFilters.toArray());

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        settings: state.settings,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onRefreshPosts: () => {
            dispatch(AsyncActions.downloadRssPosts());
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

export const NewsFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeed);
