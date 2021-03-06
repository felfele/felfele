import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { Actions } from '../../../actions/Actions';
import { AsyncActions } from '../../../actions/asyncActions';
import { StateProps, DispatchProps, ContactScreen } from './ContactScreen';
import { ImageData} from '../../../models/ImageData';
import { TypedNavigation } from '../../../helpers/navigation';
import { InvitedContact, Contact, MutualContact } from '../../../models/Contact';
import { Feed } from '../../../models/Feed';

export const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const ownFeed = state.ownFeeds.length > 0
        ? state.ownFeeds[0]
        : undefined;
    const invitedContact = state.contacts.find(contact => contact.type === 'invited-contact') as (InvitedContact | undefined);
    const profile = {
        name: state.author.name,
        image: state.author.image,
        identity: state.author.identity!,
    };

    return {
        profile,
        navigation: ownProps.navigation,
        ownFeed,
        gatewayAddress: state.settings.swarmGatewayAddress,
        invitedContact,
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
        onChangeQRCode: () => {
            dispatch(AsyncActions.generateInvitedContact());
        },
        onAddFeed: (feed: Feed) => {
            dispatch(AsyncActions.addFeed(feed));
        },
        onContactStateChange: (contact: InvitedContact, updatedContact: Contact) => {
            dispatch(Actions.updateContactState(contact, updatedContact));
        },
        onReachingMutualContactState: (contact: MutualContact) => {
        },
    };
};

export const ContactScreenContainer = connect(
   mapStateToProps,
   mapDispatchToProps,
)(ContactScreen);
