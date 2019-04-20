import { connect } from 'react-redux';
import {
    StateProps,
    DispatchProps,
    WelcomeScreen,
} from './WelcomeScreen';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/Actions';
import { ImageData } from '../../../models/ImageData';
import { TypedNavigation } from '../../../helpers/navigation';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    return {
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onStartDownloadFeeds: () => {
            dispatch(AsyncActions.downloadFollowedFeedPosts());
        },
    };
};

export const WelcomeContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(WelcomeScreen);
