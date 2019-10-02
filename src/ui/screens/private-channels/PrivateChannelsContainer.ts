import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/asyncActions';
import { getPrivateChannelFeeds, getAllPrivateChannelPosts } from '../../../selectors/selectors';
import { TypedNavigation } from '../../../helpers/navigation';
import { StateProps, PrivateChannelsFeedView } from './PrivateChannelsFeedView';
import { DispatchProps } from '../../../components/RefreshableFeed';
import { Post } from '../../../models/Post';
import { Feed } from '../../../models/Feed';
import { isContactFeed } from '../../../helpers/feedHelpers';

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
        onRefreshPosts: (feeds: Feed[]) => {
            dispatch(AsyncActions.advanceContacts());
            dispatch(AsyncActions.syncPrivatePostsWithContactFeeds(feeds.filter(isContactFeed)));
        },
    };
};

export const PrivateChannelsContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PrivateChannelsFeedView);
