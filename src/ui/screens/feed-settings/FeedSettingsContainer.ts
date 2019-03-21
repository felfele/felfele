import { connect } from 'react-redux';
import { StateProps, FeedSettingsScreen } from './FeedSettingsScreen';
import { AppState } from '../../../reducers/AppState';

const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        navigation: ownProps.navigation,
        settings: state.settings,
        feed: ownProps.navigation.state.params.feed,
    };
};

export const FeedSettingsContainer = connect(mapStateToProps)(FeedSettingsScreen);
