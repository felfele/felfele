import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { getFeedPosts } from '../selectors/selectors';
import { mapDispatchToProps as defaultMapDispatchToProps } from '../containers/FeedContainer';
import { TypedNavigation, Routes } from '../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const navParamFeed = ownProps.navigation.getParam<Routes['NewsSourceFeed'], 'feed'>('feed');
    const addedFeed = state.feeds.find(value => value.feedUrl === navParamFeed.feedUrl);
    const feeds = addedFeed != null ? [ addedFeed ] : [ navParamFeed ];
    const feedName = navParamFeed.name;
    const posts = getFeedPosts(state, navParamFeed.feedUrl);
    return {
        onBack: () => ownProps.navigation.goBack(),
        navigation: ownProps.navigation,
        feedUrl: navParamFeed.feedUrl,
        feedName,
        posts,
        feeds: feeds,
        isOwnFeed: false,
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
