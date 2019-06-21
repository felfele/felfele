import {
    Share,
    ShareContent,
    ShareOptions,
} from 'react-native';

import { Feed } from '../models/Feed';
import { getFollowLink, getInviteLink } from './deepLinking';
import { InvitedContact } from '../models/Contact';

export const showShareFeedDialog = async (feed?: Feed) => {
    const title = 'Share your channel';
    const url = feed != null ? feed.feedUrl : '';
    const followLink = getFollowLink(url);
    const message = `Follow my channel on Felfele by opening this link:
${followLink}`;

    const content: ShareContent = {
        title,
        message,
    };
    const options: ShareOptions = {
    };
    await Share.share(content, options);
};

export const showShareContactDialog = async (contact: InvitedContact) => {
    const title = 'Send an invite';
    const inviteLink = getInviteLink(contact);
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
