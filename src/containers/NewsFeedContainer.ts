import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { RSSPostManager } from '../RSSPostManager';
import { AsyncActions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { StateProps, DispatchProps, NewsFeedView } from '../components/NewsFeedView';
import { getFollowedNewsPosts, getFollowedFeeds } from '../selectors/selectors';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const followedFeeds = getFollowedFeeds(state);
    const filteredPosts = getFollowedNewsPosts(state);

    RSSPostManager.setContentFilters(state.contentFilters);

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: followedFeeds,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
    };
};

export const NewsFeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(NewsFeedView);
