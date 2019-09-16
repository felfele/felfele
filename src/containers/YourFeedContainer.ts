import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, YourFeedView } from '../components/YourFeedView';
import { Post, PrivatePost } from '../models/Post';
import { Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { TypedNavigation } from '../helpers/navigation';
import { postTimeCompare } from '../selectors/selectors';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const ownPublicKey = state.author.identity!.publicKey;
    const arePostsEqual = (a: Post, b: Post) => a._id === b._id;
    const posts = Object
        .values(state.privatePosts)
        .reduce((prev, curr) => prev.concat(curr), [])
        .filter(post => post.author.identity != null && post.author.identity.publicKey === ownPublicKey)
        .sort(postTimeCompare)
        .reduce<PrivatePost[]>((prev, curr, ind, arr) =>
            ind > 0 && arePostsEqual(curr, arr[ind - 1])
                ? prev
                : prev.concat(curr)
        , [])
    ;

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
