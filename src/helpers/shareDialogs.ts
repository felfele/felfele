import {
    Share,
    ShareContent,
    ShareOptions,
} from 'react-native';
// @ts-ignore
import * as base64 from 'base-64';

import { Feed } from '../models/Feed';

export const showShareFeedDialog = async (feed?: Feed) => {
    const title = 'Share your channel';
    const url = feed != null ? feed.feedUrl : '';
    const message = `Follow my channel on Felfele by opening this link:
https://app.felfele.org/follow/${base64.encode(url)}`;

    const content: ShareContent = {
        title,
        message,
    };
    const options: ShareOptions = {
    };
    await Share.share(content, options);
};
