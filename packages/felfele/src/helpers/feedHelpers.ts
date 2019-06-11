import {
    Feed,
    LocalFeed,
    ImageData,
    isBundledImage,
} from '@felfele/felfele-core';

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
