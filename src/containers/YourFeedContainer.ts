import { connect } from 'react-redux';
import { AppState } from '../models/AppState';
import { StateProps, DispatchProps, YourFeedView } from '../components/YourFeedView';
import { Post } from '../models/Post';
import { Actions, AsyncActions } from '../actions/Actions';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const posts = state.localPosts;
    const filteredPosts = posts;

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: state.feeds.filter(feed => feed != null && feed.followed === true),
        settings: state.settings,
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
    };
};

export const YourFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeedView);
