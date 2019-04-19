import { connect } from 'react-redux';
import { StateProps, DispatchProps } from './Onboarding';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/Actions';
import { ImageData } from '../../../models/ImageData';
import { TypedNavigation } from '../../../helpers/navigation';
import { Onboarding } from './Onboarding';

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
            await dispatch(AsyncActions.chainActions([
                AsyncActions.updateProfileName(name),
                AsyncActions.updateProfileImage(image),
                AsyncActions.createUserIdentity(),
                AsyncActions.createOwnFeed(),
            ]));
            navigation.navigate('Loading', {});
        },
    };
};

export const OnboardingContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Onboarding);
