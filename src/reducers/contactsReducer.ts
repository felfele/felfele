import { Contact } from '../models/Contact';
import { Actions } from '../actions/Actions';
import { replaceItemInArray, removeFromArray } from '../helpers/immutable';

export const contactsReducer = (contacts: Contact[] = [], action: Actions): Contact[] => {
    switch (action.type) {
        case 'ADD-CONTACT': {
            const publicKey = action.payload.contact.type === 'mutual-contact'
                ? action.payload.contact.identity.publicKey
                : action.payload.contact.contactIdentity.publicKey
            ;
            const contactPredicate = action.payload.contact.type === 'mutual-contact'
                ? (contact: Contact) =>
                    contact.type === 'mutual-contact' &&
                    contact.identity.publicKey === publicKey
                : (contact: Contact) =>
                    contact.type !== 'mutual-contact' &&
                    contact.contactIdentity.publicKey === publicKey
            ;
            const index = contacts.findIndex(contactPredicate);
            return index === -1
                ? [action.payload.contact, ...contacts]
                : contacts
            ;
        }
        case 'UPDATE-CONTACT-STATE': {
            const index = contacts.findIndex(contact =>
                contact.type === action.payload.contact.type &&
                contact.contactIdentity.publicKey === action.payload.contact.contactIdentity.publicKey
            );
            if (action.payload.updatedContact.type === 'mutual-contact') {
                const payloadUpdatedContact = action.payload.updatedContact;
                const mutualIndex = contacts.findIndex(contact =>
                    contact.type === 'mutual-contact' &&
                    contact.identity.publicKey === payloadUpdatedContact.identity.publicKey
                );
                if (mutualIndex !== -1) {
                    return removeFromArray(contacts, index);
                }
            }
            return index !== -1
                ? replaceItemInArray(contacts, action.payload.updatedContact, index)
                : contacts
            ;
        }
        case 'DELETE-ALL-CONTACTS': {
            return [];
        }
        case 'CONFIRM-CONTACT': {
            const index = contacts.findIndex(contact =>
                contact.type === 'mutual-contact' &&
                contact.identity.publicKey === action.payload.contact.identity.publicKey
            );
            if (index === -1) {
                return contacts;
            }
            const confirmedContact = {
                ...contacts[index],
                confirmed: true,
            };
            return replaceItemInArray(contacts, confirmedContact, index);
        }
        case 'REMOVE-CONTACT': {
            if (action.payload.contact.type === 'mutual-contact') {
                const publicKey = action.payload.contact.identity.publicKey;
                const index = contacts.findIndex(contact =>
                    contact.type === 'mutual-contact' &&
                    contact.identity.publicKey === publicKey
                );
                return index !== -1
                    ? removeFromArray(contacts, index)
                    : contacts
                ;
            } else {
                const publicKey = action.payload.contact.contactIdentity.publicKey;
                const index = contacts.findIndex(contact =>
                    contact.type !== 'mutual-contact' &&
                    contact.contactIdentity.publicKey === publicKey
                );
                return index !== -1
                    ? removeFromArray(contacts, index)
                    : contacts
                ;
            }
        }
        case 'REMOVE-UNCONFIRMED-CONTACTS': {
            return contacts.filter(contact =>
                !(contact.type === 'mutual-contact' && contact.confirmed)
            );
        }
    }
    return contacts;
};
