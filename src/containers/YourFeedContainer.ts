import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, YourFeedView } from '../components/YourFeedView';
import { Post } from '../models/Post';
import { Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { TypedNavigation } from '../helpers/navigation';
import { getYourSortedUniquePosts } from '../selectors/selectors';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const posts = getYourSortedUniquePosts(state);

    return {
        navigation: ownProps.navigation,
        posts,
        feeds: state.feeds.filter(feed => feed != null && feed.followed === true),
        profileImage: state.author.image,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRefreshPosts: () => {
            // workaround to finish refresh
            dispatch(Actions.timeTick());
        },
        onSaveDraft: (draft: Post) => {
            dispatch(Actions.addDraft(draft));
        },
    };
};

export const YourFeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(YourFeedView);
