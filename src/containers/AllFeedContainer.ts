import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { RSSPostManager } from '../RSSPostManager';
import { AsyncActions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { StateProps, DispatchProps, AllFeedScreen } from '../components/AllFeedScreen';
import { getAllFeeds, getAllPostsSorted } from '../selectors/selectors';
import { Post } from '../models/Post';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const followedFeeds = getAllFeeds(state);
    const filteredPosts = getAllPostsSorted(state);

    RSSPostManager.setContentFilters(state.contentFilters);

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: followedFeeds,
        profileImage: state.author.image,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
        onSavePost: (post: Post) => {
            dispatch(AsyncActions.createPost(post));
        },
    };
};

export const AllFeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AllFeedScreen);
