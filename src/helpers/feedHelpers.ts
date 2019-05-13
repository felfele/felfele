import { Feed } from '../models/Feed';
import { LocalFeed } from '../social/api';
import { ImageData } from '../models/ImageData';

export const getFeedImage = (feed: Feed): ImageData => {
    if (typeof feed.favicon === 'number') {
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
