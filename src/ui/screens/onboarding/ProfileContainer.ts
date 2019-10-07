import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { AsyncActions } from '../../../actions/asyncActions';
import { StateProps, DispatchProps, ProfileScreen } from './ProfileScreen';
import { ImageData } from '../../../models/ImageData';
import { TypedNavigation } from '../../../helpers/navigation';
import { Feed } from '../../../models/Feed';
import { InvitedContact, Contact, MutualContact } from '../../../models/Contact';
import { PrivateIdentity } from '../../../models/Identity';

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
        onCreateUser: async (name: string, image: ImageData, navigation: TypedNavigation, identity?: PrivateIdentity) => {
            await dispatch(AsyncActions.createUser(name, image, identity));
            navigation.navigate('Loading', {});
        },
        onChangeQRCode: () => {},
        onAddFeed: (feed: Feed) => {},
        onContactStateChange: (contact: InvitedContact, updatedContact: Contact) => {},
        onReachingMutualContactState: (contact: MutualContact) => {},
    };
};

export const ProfileContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(ProfileScreen);
