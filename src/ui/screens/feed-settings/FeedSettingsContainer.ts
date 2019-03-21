import { connect } from 'react-redux';
import { StateProps, DispatchProps, FeedSettingsScreen } from './FeedSettingsScreen';
import { AppState } from '../../../reducers/AppState';
import { LocalFeed } from '../../../social/api';
import { Actions } from '../../../actions/Actions';
import { emptyPostCommandLog } from '../../../social/api';

const emptyFeed: LocalFeed = {
    name: '',
    url: '',
    feedUrl: '',
    favicon: '',
    isSyncing: false,
    authorImage: {},
    posts: [],
    postCommandLog: emptyPostCommandLog,
    autoShare: false,
};

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    const paramFeed = ownProps.navigation.state.params.feed;
    const feed = state.ownFeeds.find(ownFeed => ownFeed.feedUrl === paramFeed.feedUrl) || emptyFeed;
    return {
        navigation: ownProps.navigation,
        settings: state.settings,
        feed,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onChangeFeedSharing: (feed: LocalFeed, shared: boolean) => {
            dispatch(Actions.updateOwnFeed({
                feedUrl: feed.feedUrl,
                autoShare,
            }));
        },
    };
};

export const FeedSettingsContainer = connect(mapStateToProps, mapDispatchToProps)(FeedSettingsScreen);
