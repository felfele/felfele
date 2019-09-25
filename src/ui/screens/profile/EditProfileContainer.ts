import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/asyncActions';
import { StateProps, DispatchProps, EditProfile } from './EditProfile';
import { ImageData} from '../../../models/ImageData';
import { TypedNavigation } from '../../../helpers/navigation';

export const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const profile = {
        name: state.author.name,
        image: state.author.image,
        identity: state.author.identity!,
    };

    return {
        profile,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
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
    };
};

export const EditProfileContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(EditProfile);
