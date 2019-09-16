import { createAction } from './actionHelpers';
import { Contact, NonMutualContact, MutualContact } from '../models/Contact';
import { ActionTypes } from './ActionTypes';
import { PrivateChannelSyncData } from '../protocols/privateChannel';

export const ContactActions = {
    addContact: (contact: Contact) =>
        createAction(ActionTypes.ADD_CONTACT, { contact }),
    updateContactState: (contact: NonMutualContact, updatedContact: Contact) =>
        createAction(ActionTypes.UPDATE_CONTACT_STATE, { contact, updatedContact }),
    confirmContact: (contact: MutualContact) =>
        createAction(ActionTypes.CONFIRM_CONTACT, { contact }),
    removeContact: (contact: Contact) =>
        createAction(ActionTypes.REMOVE_CONTACT, { contact }),
    deleteAllContacts: () =>
        createAction(ActionTypes.DELETE_ALL_CONTACTS, {}),
    removeUnconfirmedContacts: () =>
        createAction(ActionTypes.REMOVE_UNCONFIRMED_CONTACTS),
    updateContactPrivateChannel: (contact: MutualContact, privateChannel: PrivateChannelSyncData) =>
        createAction(ActionTypes.UPDATE_CONTACT_PRIVATE_CHANNEL, { contact, privateChannel }),
};
