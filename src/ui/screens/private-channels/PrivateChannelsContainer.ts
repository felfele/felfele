import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/asyncActions';
import { getPrivateChannelFeedsPosts, getPrivateChannelFeeds, getAllPrivateChannelPosts } from '../../../selectors/selectors';
import { TypedNavigation } from '../../../helpers/navigation';
import { StateProps, DispatchProps, PrivateChannelsFeedView } from './PrivateChannelsFeedView';
import { ContactFeed } from '../../../models/ContactFeed';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const posts = getAllPrivateChannelPosts(state);
    const privateChannelFeeds = getPrivateChannelFeeds(state);

    return {
        navigation: ownProps.navigation,
        posts: posts,
        feeds: privateChannelFeeds,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onRefreshPosts: (feeds: ContactFeed[]) => {
            dispatch(AsyncActions.syncPrivatePostsWithContactFeeds(feeds));
        },
    };
};

export const PrivateChannelsContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PrivateChannelsFeedView);
