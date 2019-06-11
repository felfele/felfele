import { OpenGraphData, getHtmlOpenGraphData } from './openGraph';
import { RSSFeedManager } from '../RSSPostManager';
import { FaviconCache } from '../FaviconCache';
import { HtmlUtils } from '../HtmlUtils';
import { Feed } from '@felfele/felfele-core';

export interface HtmlMetaData extends OpenGraphData {
    icon: string;
    feedUrl: string;
    feedTitle: string;
    createdAt: number;
    updatedAt: number;
}

export const fetchHtmlMetaData = async (url: string): Promise<HtmlMetaData> => {
    const response = await fetch(url);
    const html = await response.text();
    const feed = await fetchFeedFromUrl(url);
    const document = HtmlUtils.parse(html);
    const openGraphData = getHtmlOpenGraphData(document);
    const feedName = feed != null ? feed.name : '';
    const name = getFirstNonEmpty([getMetaName(document), openGraphData.name, feedName]);
    const title = getHtmlTitle(document, openGraphData.title);
    const icon = await FaviconCache.getFavicon(url);
    const createdAt = getPublishedTime(document);
    const updatedAt = getModifiedTime(document, createdAt);
    return {
        ...openGraphData,
        title,
        name,
        icon,
        feedUrl: feed != null ? feed.feedUrl : '',
        feedTitle: feedName,
        createdAt,
        updatedAt,
    };
};

const fetchFeedFromUrl = async (url: string): Promise<Feed | null> => {
    try {
        const feed = await RSSFeedManager.fetchFeedFromUrl(url);
        return feed;
    } catch (e) {
        return null;
    }
};

interface HtmlChildNode extends ChildNode {
    value: string;
}

const getHtmlTitle = (document: HTMLElement, defaultTitle: string): string => {
    const htmlTitleNodes = HtmlUtils.findPath(document, ['html', 'head', 'title']);
    return htmlTitleNodes.length > 0
        ? (htmlTitleNodes[0].childNodes[0] as HtmlChildNode).value || defaultTitle
        : defaultTitle
    ;
};

const getMetaName = (document: HTMLElement, defaultTitle: string = ''): string => {
    const metaNodes = HtmlUtils.findPath(document, ['html', 'head', 'meta']);
    for (const meta of metaNodes) {
        if (HtmlUtils.matchAttributes(meta, [{ name: 'property', value: 'al:iphone:app_name' }]) ||
            HtmlUtils.matchAttributes(meta, [{ name: 'property', value: 'al:android:app_name' }]) ||
            HtmlUtils.matchAttributes(meta, [{ name: 'name', value: 'twitter:app:name:googleplay' }]) ||
            HtmlUtils.matchAttributes(meta, [{ name: 'name', value: 'apple-mobile-web-app-title' }]) ||
            HtmlUtils.matchAttributes(meta, [{ name: 'name', value: 'application-name' }])
        ) {
            const content = HtmlUtils.getAttribute(meta, 'content');
            if (content != null) {
                return content;
            }
        }
    }
    return defaultTitle;
};

const getPublishedTime = (document: HTMLElement): number => {
    const metaNodes = HtmlUtils.findPath(document, ['html', 'head', 'meta']);
    for (const meta of metaNodes) {
        if (HtmlUtils.matchAttributes(meta, [{ name: 'property', value: 'article:published' }]) ||
            HtmlUtils.matchAttributes(meta, [{ name: 'property', value: 'article:published_time' }])
        ) {
            const content = HtmlUtils.getAttribute(meta, 'content');
            if (content != null) {
                return Date.parse(content);
            }
        }
    }
    return 0;
};

const getModifiedTime = (document: HTMLElement, defaultTime: number): number => {
    const metaNodes = HtmlUtils.findPath(document, ['html', 'head', 'meta']);
    for (const meta of metaNodes) {
        if (HtmlUtils.matchAttributes(meta, [{ name: 'property', value: 'article:modified' }]) ||
            HtmlUtils.matchAttributes(meta, [{ name: 'property', value: 'article:modified_time' }])
        ) {
            const content = HtmlUtils.getAttribute(meta, 'content');
            if (content != null) {
                return Date.parse(content);
            }
        }
    }
    return defaultTime;
};

const getFirstNonEmpty = (items: string[], defaultValue = ''): string => {
    for (const item of items) {
        if (item !== '') {
            return item;
        }
    }
    return defaultValue;
};
