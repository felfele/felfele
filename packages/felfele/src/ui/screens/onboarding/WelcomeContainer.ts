import { connect } from 'react-redux';
import {
    StateProps,
    DispatchProps,
    WelcomeScreen,
} from './WelcomeScreen';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/Actions';
import { ImageData } from '@felfele/felfele-core';
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
        onCreateUser: async (name: string, image: ImageData, navigation: TypedNavigation) => {
            await dispatch(AsyncActions.createUser(name, image));
            navigation.navigate('Loading', {});
        },
    };
};

export const WelcomeContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(WelcomeScreen);
