import { RSSItem, RSSThumbnail, RSSFeed, RSSFeedWithMetrics } from './RSSFeedHelpers';
import * as urlUtils from './urlUtils';

interface RedditImageData {
    url: string;
    width: number;
    height: number;
}

interface RedditImage {
    source: RedditImageData;
    resolutions: RedditImageData[];
}

interface RedditPostData {
    title: string;
    url: string;
    is_video: boolean;
    permalink: string;
    created_utc: number;
    post_hint: undefined | 'link' | 'image' | 'hosted:video';
    preview?: {
        images: RedditImage[];
        enabled: boolean;
    };
}

interface RedditPost {
    kind: string;
    data: RedditPostData;
}

const IMAGE_DIMENSION_THRESHOLD = 1200;

export const redditFeedUrl = (url: string) => url.slice(0, -4).concat('.json');

const findBestResolutionRedditImage = (redditImage: RedditImage): RedditImageData | undefined => {
    const allImages = [redditImage.source, ...redditImage.resolutions];
    const sortedImages = allImages.sort((a, b) => b.width - a.width);
    for (const image of sortedImages) {
        if (image.width > IMAGE_DIMENSION_THRESHOLD || image.height > IMAGE_DIMENSION_THRESHOLD) {
            continue;
        }
        return image;
    }
    return sortedImages.length > 0
        ? sortedImages[0]
        : undefined
    ;
};

const redditPostDataImages = (postData: RedditPostData): RSSThumbnail[] => {
    const hasPreview = postData.preview != null;
    const image = hasPreview
        ? findBestResolutionRedditImage(postData.preview!.images[0])
        : undefined
    ;
    return image != null
        ? [{
            url: [image.url.replace(/&amp;/gi, '&')],
            width: [image.width],
            height: [image.height],
        }]
        : []
    ;
};

const redditPostDataToRSSItem = (postData: RedditPostData): RSSItem => {
    const redditMobileLink = urlUtils.getCanonicalUrl('m.' + urlUtils.REDDIT_COM).slice(0, -1) + postData.permalink;
    const created = Math.floor(postData.created_utc * 1000);
    switch (postData.post_hint) {
    case undefined: return {
            title: '',
            description: postData.title + `<p/>[Comments](${redditMobileLink})`,
            link: postData.url,
            url: postData.url,
            created,
            media: {
                thumbnail: redditPostDataImages(postData),
            },
        };
    default: return {
            title: '',
            description: postData.title,
            link: redditMobileLink,
            url: redditMobileLink,
            created,
            media: {
                thumbnail: redditPostDataImages(postData),
            },
        };
    }
};

export const loadRedditFeed = (url: string, text: string, startTime: number, downloadTime: number) => {
    const parseTime = Date.now();
    const xmlTime = parseTime;
    const feed = JSON.parse(text);
    const posts: RedditPost[] = feed.data.children;
    const items: RSSItem[] = posts.map(post => redditPostDataToRSSItem(post.data));
    const rssFeed: RSSFeed = {
        title: '',
        description: '',
        url,
        items,
    };
    const rssFeedWithMetrics: RSSFeedWithMetrics = {
        feed: rssFeed,
        url,
        size: text.length,
        downloadTime: downloadTime - startTime,
        xmlTime: xmlTime - downloadTime,
        parseTime: parseTime - xmlTime,
    };
    return rssFeedWithMetrics;
};
