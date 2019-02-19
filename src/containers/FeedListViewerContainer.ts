import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, FeedListViewer } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { sortFeeds, updateFavicons, mapDispatchToProps } from './FeedListEditorContainer';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const feedsWithCorrectFavicons = updateFavicons(ownProps.navigation.state.params.feeds);
    const feedsToDisplay = sortFeeds(feedsWithCorrectFavicons);
    return {
        feeds: feedsToDisplay,
        navigation: ownProps.navigation,
        onPressFeed: onPressFeed,
    };
};

const onPressFeed = (navigation: any, feed: Feed) => {
    navigation.navigate('FeedFromList', { feedUrl: feed.feedUrl, name: feed.name });
};

export const FeedListViewerContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedListViewer);
