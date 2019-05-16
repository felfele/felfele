import {
    Share,
    ShareContent,
    ShareOptions,
} from 'react-native';

import { Feed } from '../models/Feed';

export const showShareFeedDialog = async (feed?: Feed) => {
    const title = 'Share your channel';
    const url = feed != null ? feed.url : '';
    const message = `Follow my channel on Felfele (https://felfele.org/app)
Copy this message and tap the add channel button on the Home screen!

${url}`;

    const content: ShareContent = {
        title,
        message,
    };
    const options: ShareOptions = {
    };
    await Share.share(content, options);
};
