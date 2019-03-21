import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, YourFeedView } from '../components/YourFeedView';
import { Post } from '../models/Post';
import { Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const posts = state.localPosts;
    const filteredPosts = posts;

    return {
        navigation: ownProps.navigation,
        posts: filteredPosts,
        feeds: state.feeds.filter(feed => feed != null && feed.followed === true),
        profileImage: state.author.image,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRefreshPosts: (feeds: Feed[]) => {
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
