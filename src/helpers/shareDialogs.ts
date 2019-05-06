import { Share, ShareContent, ShareOptions, Platform } from 'react-native';

import { Feed } from '../models/Feed';

export const showShareFeedDialog = async (feed?: Feed) => {
    const url = feed != null ? feed.url : '';
    const title = 'Share your channel';
    const message = Platform.OS === 'android' ? url : undefined;
    const content: ShareContent = {
        url,
        title,
        message,
    };
    const options: ShareOptions = {
    };
    await Share.share(content, options);
};
