import { connect } from 'react-redux';
import {
    StateProps,
    DispatchProps,
    WelcomeScreen,
} from './WelcomeScreen';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/asyncActions';
import { Actions } from '../../../actions/Actions';
import { ImageData } from '../../../models/ImageData';
import { TypedNavigation } from '../../../helpers/navigation';
import testIdentity from '../../../../testdata/testIdentity.json';
import { PrivateIdentity } from '../../../models/Identity';
import * as Swarm from '../../../swarm/Swarm';
import { getFallbackUserImage } from '../../../defaultUserImage';

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
            dispatch(Actions.changeSettingShowDebugMenu(true));
            dispatch(Actions.changeSettingSwarmGatewayAddress(Swarm.defaultDebugGateway));
            const identity = testIdentity as PrivateIdentity;
            const generatedImage = await getFallbackUserImage(testIdentity.publicKey);
            await dispatch(AsyncActions.createUser('TestUser', generatedImage, identity));
            navigation.navigate('Loading', {});
        },
    };
};

export const WelcomeContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(WelcomeScreen);
