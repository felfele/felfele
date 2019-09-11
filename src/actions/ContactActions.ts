import { createAction } from './actionHelpers';
import { Contact, NonMutualContact } from '../models/Contact';
import { ActionTypes } from './ActionTypes';

export const ContactActions = {
    addContact: (contact: Contact) =>
        createAction(ActionTypes.ADD_CONTACT, { contact }),
    updateContactState: (contact: NonMutualContact, updatedContact: Contact) =>
        createAction(ActionTypes.UPDATE_CONTACT_STATE, { contact, updatedContact }),
    removeContact: (contact: Contact) =>
        createAction(ActionTypes.REMOVE_CONTACT, { contact }),
    deleteAllContacts: () =>
        createAction(ActionTypes.DELETE_ALL_CONTACTS, {}),
};
