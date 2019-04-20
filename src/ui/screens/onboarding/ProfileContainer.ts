import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/Actions';
import { StateProps, DispatchProps, ProfileScreen } from './ProfileScreen';
import { ImageData } from '../../../models/ImageData';
import { TypedNavigation } from '../../../helpers/navigation';

export const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    return {
        author: state.author,
        gatewayAddress: state.settings.swarmGatewayAddress,
        navigation: ownProps.navigation,
   };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onUpdateAuthor: (text: string) => {
            dispatch(AsyncActions.updateProfileName(text));
        },
        onUpdatePicture: (image: ImageData) => {
            dispatch(AsyncActions.updateProfileImage(image));
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

export const ProfileContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(ProfileScreen);
