import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { RSSPostManager } from '../../../RSSPostManager';
import { Actions } from '../../../actions/Actions';
import { Feed } from '../../../models/Feed';
import { StateProps, DispatchProps, PublicChannelsScreen } from './PublicChannelsScreen';
import { getAllFeeds, getAllPostsSorted } from '../../../selectors/selectors';
import { Post } from '../../../models/Post';
import { TypedNavigation } from '../../../helpers/navigation';
import { AsyncActions } from '../../../actions/asyncActions';

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

export const PublicChannelsContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PublicChannelsScreen);
