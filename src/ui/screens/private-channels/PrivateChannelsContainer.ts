import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/asyncActions';
import { getPrivateChannelFeeds, getAllPrivateChannelPosts } from '../../../selectors/selectors';
import { TypedNavigation } from '../../../helpers/navigation';
import { StateProps, DispatchProps, PrivateChannelsFeedView } from './PrivateChannelsFeedView';
import { ContactFeed } from '../../../models/ContactFeed';
import { Post } from '../../../models/Post';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const allPosts = getAllPrivateChannelPosts(state);
    const ownPublicKey = state.author.identity != null
        ? state.author.identity.publicKey
        : undefined
    ;
    const isOwnPost = (post: Post) => post.author != null && post.author.identity != null && post.author.identity.publicKey === ownPublicKey;
    const posts = allPosts.filter(post => !isOwnPost(post));
    const privateChannelFeeds = getPrivateChannelFeeds(state);

    return {
        navigation: ownProps.navigation,
        posts,
        feeds: privateChannelFeeds,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRefreshPosts: (feeds: ContactFeed[]) => {
            dispatch(AsyncActions.advanceContacts());
            dispatch(AsyncActions.syncPrivatePostsWithContactFeeds(feeds));
        },
    };
};

export const PrivateChannelsContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PrivateChannelsFeedView);
