import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { Actions } from '../actions/Actions';
import { Feed } from '../models/Feed';
import { getFeedPosts } from '../selectors/selectors';
import { mapDispatchToProps as defaultMapDispatchToProps } from '../containers/FeedContainer';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const feed = ownProps.navigation.state.params.feed;
    const addedFeed = state.feeds.find(value => value.feedUrl === feed.feedUrl);
    const feeds = addedFeed != null ? [ addedFeed ] : [ feed ];
    const feedName = ownProps.navigation.state.params.feed.name;
    const posts = getFeedPosts(state, feed.feedUrl);
    return {
        onBack: () => ownProps.navigation.goBack(),
        navigation: ownProps.navigation,
        feedUrl: feed.feedUrl,
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
