import { Feed } from '../models/Feed';
import { LocalFeed } from '../social/api';
import { ImageData } from '../models/ImageData';
import { isBundledImage } from './imageDataHelpers';

export const getFeedImage = (feed: Feed): ImageData => {
    if (isBundledImage(feed.favicon)) {
        return {
            localPath: feed.favicon,
        };
    }
    const image: ImageData = (feed as LocalFeed).authorImage != null
        ? (feed as LocalFeed).authorImage
        : { uri: feed.favicon }
    ;
    return image;
};

export const sortFeedsByName = (feeds: Feed[]): Feed[] => {
    return feeds.sort((a, b) => a.name.localeCompare(b.name));
};
