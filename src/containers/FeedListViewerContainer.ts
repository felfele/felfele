import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListViewer } from '../components/FeedListEditor';
import { getSwarmGatewayUrl } from '../Swarm';
import { Feed } from '../models/Feed';

const favoriteCompare = (a: Feed, b: Feed): number => (b.favorite === true ? 1 : 0) - (a.favorite === true ? 1 : 0);

const followedCompare = (a: Feed, b: Feed): number => (b.followed === true ? 1 : 0) - (a.followed === true ? 1 : 0);

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const feeds = ownProps.navigation.state.params.feeds
        .map(feed => ({
            ...feed,
            favicon: getSwarmGatewayUrl(feed.favicon || ''),
        }))
        .sort((a, b) => favoriteCompare(a, b) || followedCompare (a, b) || a.name.localeCompare(b.name));
    return {
        feeds: feeds,
        navigation: ownProps.navigation,
        onPressFeed: onPressFeed,
    };
};

const onPressFeed = (navigation: any, feed: Feed) => {
    navigation.navigate('Feed', { feedUrl: feed.feedUrl, name: feed.name });
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
    };
};

export const FeedListViewerContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(FeedListViewer);
