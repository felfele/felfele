import { connect } from 'react-redux';

import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedListEditor } from '../components/FeedListEditor';
import { getSwarmGatewayUrl } from '../Swarm';
import { Feed } from '../models/Feed';

const favoriteCompare = (a: Feed, b: Feed): number => (b.favorite === true ? 1 : 0) - (a.favorite === true ? 1 : 0);

const followedCompare = (a: Feed, b: Feed): number => (b.followed === true ? 1 : 0) - (a.followed === true ? 1 : 0);

const getFeedFavicon = (feed: Feed) => feed._localFavicon != null ? feed._localFavicon : feed.favicon;

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    const feeds = state.feeds.toArray()
        .map(feed => ({
            ...feed,
            favicon: getSwarmGatewayUrl(getFeedFavicon(feed) || ''),
        }))
        .sort((a, b) => favoriteCompare(a, b) || followedCompare (a, b) || a.name.localeCompare(b.name));
    console.log('FeedListEditorContainer.mapStateToProps', feeds);
    return {
        feeds,
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
    };
};

export const FeedListEditorContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(FeedListEditor);
