import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import { getSwarmGatewayUrl } from '../swarm/Swarm';
import { Feed } from '../models/Feed';

const favoriteCompare = (a: Feed, b: Feed): number => (b.favorite === true ? 1 : 0) - (a.favorite === true ? 1 : 0);

const followedCompare = (a: Feed, b: Feed): number => (b.followed === true ? 1 : 0) - (a.followed === true ? 1 : 0);

export const updateFavicons = (feeds: Feed[]): Feed[] => feeds.map(feed => ({
    ...feed,
    favicon: getSwarmGatewayUrl(feed.favicon || ''),
}));

export const sortFeeds = (feeds: Feed[]): Feed[] => feeds.sort((a, b) => favoriteCompare(a, b) || followedCompare (a, b) || a.name.localeCompare(b.name));

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const feedsWithCorrectFavicons = updateFavicons(state.feeds);
    const feedsToDisplay = sortFeeds(feedsWithCorrectFavicons);
    return {
        feeds: feedsToDisplay,
        navigation: ownProps.navigation,
        onPressFeed: onPressFeed,
    };
};

const onPressFeed = (navigation: any, feed: Feed) => {
    navigation.navigate('FeedInfo', { feed: feed });
};

export const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
    };
};

export const FeedListEditorContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedListEditor);
