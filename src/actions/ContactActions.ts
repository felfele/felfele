import { createAction } from './actionHelpers';
import {
    Contact,
    NonMutualContact,
    MutualContact,
} from '../models/Contact';
import { ActionTypes } from './ActionTypes';
import { PrivateChannelSyncData } from '../protocols/privateChannel';

export const ContactActions = {
    addContact: (contact: Contact) =>
        createAction(ActionTypes.ADD_CONTACT, { contact }),
    updateContactState: (contact: NonMutualContact, updatedContact: Contact) =>
        createAction(ActionTypes.UPDATE_CONTACT_STATE, { contact, updatedContact }),
    removeContact: (contact: Contact) =>
        createAction(ActionTypes.REMOVE_CONTACT, { contact }),
    removeExpiredContacts: (timestamp?: number) =>
        createAction(ActionTypes.REMOVE_EXPIRED_CONTACTS, { timestamp }),
    deleteAllContacts: () =>
        createAction(ActionTypes.DELETE_ALL_CONTACTS, {}),
    updateContactPrivateChannel: (contact: MutualContact, privateChannel: PrivateChannelSyncData) =>
        createAction(ActionTypes.UPDATE_CONTACT_PRIVATE_CHANNEL, { contact, privateChannel }),
};
