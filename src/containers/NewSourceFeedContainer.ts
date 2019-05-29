import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, FeedView, ViewFeed } from '../components/FeedView';
import { Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { getFeedPosts } from '../selectors/selectors';
import { mapDispatchToProps as defaultMapDispatchToProps } from '../containers/FeedContainer';
import { TypedNavigation } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const navParamFeed = ownProps.navigation.getParam<'NewsSourceFeed', 'feed'>('feed');
    const addedFeed = state.feeds.find(value => value.feedUrl === navParamFeed.feedUrl);
    const feedToAdd = addedFeed != null ? addedFeed : navParamFeed;
    const feed: ViewFeed = {
        ...feedToAdd,
        isOwnFeed: false,
        isLocalFeed: false,
    };
    const posts = getFeedPosts(state, navParamFeed.feedUrl);
    return {
        onBack: () => ownProps.navigation.goBack(),
        navigation: ownProps.navigation,
        posts,
        feed,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        ...defaultMapDispatchToProps(dispatch),
        onFollowFeed: (feed: Feed) => {
            dispatch(Actions.addFeed(feed));
            dispatch(Actions.followFeed(feed));
        },
    };
};

export const NewsSourceFeedContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedView);
