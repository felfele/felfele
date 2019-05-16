import { Share, ShareContent, ShareOptions, Platform } from 'react-native';

import { Feed } from '../models/Feed';

export const showShareFeedDialog = async (feed?: Feed) => {
    const title = 'Share your channel';
    const url = feed != null ? feed.url : '';
    const message = `Follow my channel on Felfele (https://felfele.org/app) by copying this message ${url} and tap the add channel button on the Home screen!`;
    const content: ShareContent = {
        title,
        message,
    };
    const options: ShareOptions = {
    };
    await Share.share(content, options);
};
