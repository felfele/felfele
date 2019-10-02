import {
    Share,
    ShareContent,
    ShareOptions,
} from 'react-native';

import { getInviteLink } from './deepLinking';
import { InvitedContact } from '../models/Contact';
import { CONTACT_EXPIRY_THRESHOLD } from './contactHelpers';

export const showShareContactDialog = async (contact: InvitedContact, profileName: string) => {
    const title = 'Send an invite';
    const inviteLink = getInviteLink(contact, profileName);
    const message = `Contact me on Felfele by opening this link:
${inviteLink}`;

    const content: ShareContent = {
        title,
        message,
    };
    const options: ShareOptions = {
    };
    await Share.share(content, options);
};
