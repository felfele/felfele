import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { RSSPostManager } from '../RSSPostManager';
import { AsyncActions, Actions } from '../actions/Actions';
import { Feed } from '@felfele/felfele-core';
import { StateProps, DispatchProps, AllFeedScreen } from '../components/AllFeedScreen';
import { getAllFeeds, getAllPostsSorted } from '../selectors/selectors';
import { Post } from '@felfele/felfele-core';
import { TypedNavigation } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const followedFeeds = getAllFeeds(state);
    const filteredPosts = getAllPostsSorted(state);

    RSSPostManager.setContentFilters(state.contentFilters);

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: followedFeeds,
        profileImage: state.author.image,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.downloadPostsFromFeeds(feeds));
        },
        onSaveDraft: (draft: Post) => {
            dispatch(Actions.addDraft(draft));
        },
    };
};

export const AllFeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AllFeedScreen);
