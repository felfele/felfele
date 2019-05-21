import {
    Share,
    ShareContent,
    ShareOptions,
} from 'react-native';

import { Feed } from '../models/Feed';

export const showShareFeedDialog = async (feed?: Feed) => {
    const title = 'Share your channel';
    const url = feed != null ? feed.feedUrl : '';
    const message = `Follow my channel on Felfele by opening this link:
https://app.felfele.org/follow/${btoa(url)}`;

    const content: ShareContent = {
        title,
        message,
    };
    const options: ShareOptions = {
    };
    await Share.share(content, options);
};
