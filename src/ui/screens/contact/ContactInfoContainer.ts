import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { Actions } from '../../../actions/Actions';
import { StateProps, DispatchProps, ContactInfo } from './ContactInfo';
import { TypedNavigation } from '../../../helpers/navigation';
import { MutualContact, Contact } from '../../../models/Contact';
import { findContactByPublicKey, UnknownContact } from '../../../helpers/contactHelpers';
import { ContactConfirm } from './ContactConfirm';

const mapStateToProps = (state: AppState, ownProps: {navigation: TypedNavigation}): StateProps => {
    const publicKey = ownProps.navigation.getParam<'ContactInfo', 'publicKey'>('publicKey');
    const unknownContact: UnknownContact = { type: 'unknown-contact' };
    const contact = findContactByPublicKey(publicKey, state.contacts) || unknownContact;
    return {
        contact,
        navigation: ownProps.navigation,
        gatewayAddress: state.settings.swarmGatewayAddress,
    };
};

const mapDispatchToProps = (dispatch: any, ownProps: {navigation: TypedNavigation}): DispatchProps => {
    return {
        onConfirmContact: (contact: MutualContact) => {
            ownProps.navigation.navigate('ContactSuccess', { contact: contact, isReceiver: true });
        },
        onRemoveContact: (contact: Contact) => {
            dispatch(Actions.removeContact(contact));
        },
    };
};

export const ContactInfoContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ContactInfo);

export const ContactConfirmContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ContactConfirm);
