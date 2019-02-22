import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, YourFeedView } from '../components/YourFeedView';
import { Post } from '../models/Post';
import { Actions, AsyncActions } from '../actions/Actions';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const posts = state.localPosts;
    const filteredPosts = posts;

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: state.feeds.filter(feed => feed != null && feed.followed === true),
        profileImage: state.author.image,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
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

export const YourFeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeedView);
