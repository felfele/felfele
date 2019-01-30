import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListViewer } from '../components/FeedListEditor';
import { Feed } from '../models/Feed';
import { sortFeeds, updateFavicons, mapDispatchToProps } from './FeedListEditorContainer';

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
    navigation.navigate('Feed', { feedUrl: feed.feedUrl, name: feed.name });
};

export const FeedListViewerContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(FeedListViewer);
