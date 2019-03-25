import { connect } from 'react-redux';
import { StateProps, DispatchProps, FeedSettingsScreen } from './FeedSettingsScreen';
import { AppState } from '../../../reducers/AppState';
import { Actions } from '../../../actions/Actions';
import { TypedNavigation } from '../../../helpers/navigation';
import { Feed } from '../../../models/Feed';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const paramFeed = ownProps.navigation.getParam<'FeedSettings', 'feed'>('feed');
    const feed = state.ownFeeds.find(ownFeed => ownFeed.feedUrl === paramFeed.feedUrl) || paramFeed;
    return {
        navigation: ownProps.navigation,
        settings: state.settings,
        feed,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onChangeFeedSharing: (feed: Feed, autoShare: boolean) => {
            dispatch(Actions.updateOwnFeed({
                feedUrl: feed.feedUrl,
                autoShare,
            }));
        },
    };
};

export const FeedSettingsContainer = connect(mapStateToProps, mapDispatchToProps)(FeedSettingsScreen);
