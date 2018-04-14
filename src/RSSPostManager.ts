import { PostManager } from './PostManager';
import { Post, ImageData } from './models/Post';
import { Feed } from './models/Feed';
import { Config } from './Config';
import { FaviconCache } from './FaviconCache';
import { DateUtils } from './DateUtils';
import { Utils } from './Utils';
import { Storage } from './Storage';
import { HtmlUtils } from './HtmlUtils';

interface RSSEnclosure {
    url: string;
    length: string;
    type: string;
}

interface RSSItem {
    title: string;
    description: string;
    link: string;
    url: string;
    created: number;
    enclosures?: RSSEnclosure[];
}

interface RSSFeed {
    title: string;
    description: string;
    url: string;
    icon?: string;
    items: RSSItem[];
}

interface FeedWithMetrics {
    feed: RSSFeed;
    url: string;
    size: number;
    downloadTime: number;
    xmlTime: number;
    parseTime: number;
}

interface ContentWithMimeType {
    content: string;
    mimeType: string;
}

const FirstId = 1;

const RSSMimeTypes = [
    'application/rss+xml',
    'application/xml',
    'text/xml',
];

export class RSSFeedManager {
    public static getFeedUrlFromHtmlLink(link): string {
        for (const mimeType of RSSMimeTypes) {
            const matcher = [{name: 'type', value: mimeType}];
            if (HtmlUtils.matchAttributes(link, matcher)) {
                const feedUrl = HtmlUtils.getAttribute(link, 'href') || '';
                if (feedUrl !== '') {
                    return feedUrl;
                }
            }
        }
        return '';
    }

    public static parseFeedFromHtml(html): Feed {
        const feed: Feed = {
            name: '',
            url: '',
            feedUrl: '',
            favicon: '',
        };

        const document = HtmlUtils.parse(html);
        const links = HtmlUtils.findPath(document, ['html', 'head', 'link']);

        for (const link of links) {
            if (feed.feedUrl === '' && HtmlUtils.matchAttributes(link, [{name: 'rel', value: 'alternate'}])) {
                const feedUrl = this.getFeedUrlFromHtmlLink(link);
                if (feedUrl !== '') {
                    feed.feedUrl = feedUrl;
                }
            }
            if (feed.favicon === '' && HtmlUtils.matchAttributes(link, [{name: 'rel', value: 'shortcut icon'}])) {
                const favicon = HtmlUtils.getAttribute(link, 'href') || '';
                if (favicon !== '') {
                    feed.favicon = favicon;
                }
            }
            if (feed.favicon === '' && HtmlUtils.matchAttributes(link, [{name: 'rel', value: 'icon'}])) {
                const favicon = HtmlUtils.getAttribute(link, 'href') || '';
                if (favicon !== '') {
                    feed.favicon = favicon;
                }
            }
            if (feed.favicon === '' && HtmlUtils.matchAttributes(link, [{name: 'rel', value: 'apple-touch-icon'}])) {
                const favicon = HtmlUtils.getAttribute(link, 'href') || '';
                if (favicon !== '') {
                    feed.favicon = favicon;
                }
            }
        }

        const titles = HtmlUtils.findPath(document, ['html', 'head', 'title']);
        for (const title of titles) {
            if (title.childNodes.length > 0) {
                console.log('parseFeedFromHtml: title: ', title);
                if (title.childNodes[0].textContent != null) {
                    feed.name = title.childNodes[0].textContent!;
                    break;
                }
                // The lib we use (react-native-parse-html) returns the value
                // incorrectly in 'value' instead of 'textContent'
                const value = title.childNodes[0]['value'];
                if (value != null) {
                    feed.name = value;
                    break;
                }
            }
        }

        return feed;
    }

    public static async fetchContentWithMimeType(url): Promise<ContentWithMimeType | null> {
        const response = await fetch(url);
        if (response.status !== 200) {
            return null;
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType) {
            return null;
        }

        const parts = contentType.split(';', 2);
        const mimeType = parts.length > 1 ? parts[0] : contentType;

        const content = await response.text();

        return {
            content: content,
            mimeType: mimeType,
        };
    }

    public static getFeedFromHtml(baseUrl, html): Feed {
        const feed = RSSFeedManager.parseFeedFromHtml(html);
        if (feed.feedUrl !== '') {
            feed.feedUrl = Utils.createUrlFromUrn(feed.feedUrl, baseUrl);
        }
        if (feed.favicon !== '') {
            feed.favicon = Utils.createUrlFromUrn(feed.favicon, baseUrl);
        }
        feed.url = baseUrl;
        return feed;
    }

    public static isRssMimeType(mimeType: string): boolean {
        if (mimeType === 'application/rss+xml' ||
            mimeType === 'application/atom+xml' ||
            mimeType === 'application/xml' ||
            mimeType === 'text/xml'
        ) {
            return true;
        }

        return false;
    }

    public static async fetchRSSFeedUrlFromUrl(url): Promise<string> {
        const contentWithMimeType = await RSSFeedManager.fetchContentWithMimeType(url);
        if (!contentWithMimeType) {
            return '';
        }

        if (RSSFeedManager.isRssMimeType(contentWithMimeType.mimeType)) {
            return url;
        }

        return '';
    }

    public static async fetchFeedFromHtmlFromUrl(url): Promise<string> {
        const contentWithMimeType = await RSSFeedManager.fetchContentWithMimeType(url);
        if (!contentWithMimeType) {
            return '';
        }

        if (contentWithMimeType.mimeType === 'text/html') {
            return url;
        }

        return '';
    }

    // url can be either a website url or a feed url
    public static async fetchFeedFromUrl(url): Promise<Feed | null> {
        const contentWithMimeType = await RSSFeedManager.fetchContentWithMimeType(url);
        if (!contentWithMimeType) {
            return null;
        }

        console.log('fetchFeedFromUrl contentWithMimeType: ', contentWithMimeType);

        if (contentWithMimeType.mimeType === 'text/html') {
            const baseUrl = Utils.getBaseUrl(url);
            console.log('fetchFeedFromUrl baseUrl: ', baseUrl);
            const feed = RSSFeedManager.getFeedFromHtml(baseUrl, contentWithMimeType.content);
            console.log('fetchFeedFromUrl feed: ', feed);
            if (feed.feedUrl !== '') {
                return feed;
            }

            const altFeedLocations = ['/rss', '/feed', '/social-media/feed/', '/rss/', '/feed/'];
            if (baseUrl !== url) {
                altFeedLocations.unshift('/');
            }
            for (const altFeedLocation of altFeedLocations) {
                const altUrl = Utils.createUrlFromUrn(altFeedLocation, baseUrl);
                const altFeedUrl = await RSSFeedManager.fetchRSSFeedUrlFromUrl(altUrl);
                if (altFeedUrl !== '') {
                    feed.feedUrl = altFeedUrl;
                    return feed;
                }
            }
        }

        // It looks like there is a valid feed on the url
        if (RSSFeedManager.isRssMimeType(contentWithMimeType.mimeType)) {
            const rssFeed = await Feed.load(url, contentWithMimeType.content);
            console.log('fetchFeedFromUrl rssFeed: ', rssFeed);
            const baseUrl = Utils.getBaseUrl(url);
            console.log('fetchFeedFromUrl baseUrl: ', baseUrl);
            const name = Utils.take(rssFeed.feed.title.split(' - '), 1, rssFeed.feed.title)[0];
            const feed = {
                url: baseUrl,
                feedUrl: url,
                name: name,
                favicon: '',
            };
            // Fetch the website to augment the feed data with favicon and title
            const htmlWithMimeType = await RSSFeedManager.fetchContentWithMimeType(baseUrl);
            if (!htmlWithMimeType) {
                return null;
            }
            const feedFromHtml = RSSFeedManager.getFeedFromHtml(baseUrl, htmlWithMimeType.content);
            // Override feedUrl if it's a valid RSS feed url
            if (feed.name === '') {
                feed.name = feedFromHtml.name;
            }
            feed.favicon = feedFromHtml.favicon;
            return feed;
        }

        return null;
    }

    private readonly hardcodedFeeds: Feed[] = [
        {
            name: 'Hacker News',
            url: 'https://news.ycombinator.com/',
            feedUrl: 'https://news.ycombinator.com/rss',
            favicon: '',
        },
        {
            name: '444',
            url: 'https://444.hu/',
            feedUrl: 'https://444.hu/feed',
            favicon: '',
        },
        {
            name: 'The Verge',
            url: 'https://www.theverge.com/',
            feedUrl: 'https://www.theverge.com/rss/frontpage',
            favicon: '',
        },
        {
            name: 'Digital Trends',
            url: 'https://www.digitaltrends.com/',
            feedUrl: 'https://www.digitaltrends.com/social-media/feed/',
            favicon: '',
        },
        {
            name: 'Forbes',
            url: 'https://www.forbes.com/',
            feedUrl: 'https://www.forbes.com/social-media/feed/',
            favicon: '',
        },
        {
            name: 'The Guardian',
            url: 'https://www.theguardian.com/',
            feedUrl: 'https://www.theguardian.com/world/rss',
            favicon: '',
        },

        // 'http://index.hu/24ora/rss/', // plain HTTP is not working on iOS
    ];
    private feeds: Feed[] = this.hardcodedFeeds;

    public getFeeds(): Feed[] {
        return this.feeds;
    }

    public getFeedUrls(): string[] {
        return this.getFeeds().map(feed => feed.feedUrl);
    }

    public async loadFeedsFromStorage(): Promise<Feed[]> {
        const feeds = await Storage.feed.getAllValues();
        console.log('RSSPostManager.loadFeedsFromStorage:', feeds);
        this.feeds = this.hardcodedFeeds.concat(feeds);
        return this.feeds;
    }
}

class _RSSPostManager implements PostManager {
    public readonly feedManager = new RSSFeedManager();

    private posts: Post[] = [];
    private id = FirstId;
    private idCache = {};

    public async saveAndSyncPost(post: Post) {
        // do nothing
    }
    public async deletePost(post: Post) {
        // do nothing
    }
    public async syncPosts() {
        await this.loadPosts();
    }

    public async loadPosts() {
        const startTime = Date.now();
        const posts = [];
        const metrics: FeedWithMetrics[] = [];

        await this.feedManager.loadFeedsFromStorage();
        const storedFeeds = this.feedManager.getFeeds();
        const feedMap = {};
        for (const feed of storedFeeds) {
            feedMap[feed.feedUrl] = feed.name;
        }

        let downloadSize = 0;
        const firstLoad = this.id === FirstId;
        const loadFeedPromises = storedFeeds.map(feed => this.loadFeed(feed.feedUrl));
        const feeds = await Promise.all(loadFeedPromises);
        for (const feedWithMetrics of feeds) {
            if (feedWithMetrics) {
                downloadSize += feedWithMetrics.size;
                const rssFeed = feedWithMetrics.feed;
                const favicon = rssFeed.icon ? rssFeed.icon : await FaviconCache.getFavicon(rssFeed.url);
                console.log('RSSPostManager: ', rssFeed, favicon);
                const feedName = feedMap[feedWithMetrics.url] || feedWithMetrics.feed.title;
                const convertedPosts = this.convertRSSFeedtoPosts(rssFeed, feedName, favicon);
                posts.push.apply(posts, convertedPosts);
                metrics.push(feedWithMetrics);
            }
        }
        // Don't update when there are no new posts, e.g. when the network is down
        if (!firstLoad && posts.length === 0) {
            return;
        }

        this.posts = posts;

        if (__DEV__) {
            const stats = metrics
                .map(metric => `${Utils.getHumanHostname(metric.feed.url)}: s${metric.size} d${metric.downloadTime} x${metric.xmlTime} p${metric.parseTime}`)
                .join('\n');

            const elapsed = Date.now() - startTime;
            const firstPost: Post = {
                _id: 1,
                images: [],
                text: `Debug message: downloaded ${downloadSize} bytes, elapsed ${elapsed}\n${stats}`,
                createdAt: Date.now(),
            }
            this.posts.push(firstPost);
        }
    }

    public getAllPosts(): Post[] {
        return this.posts.sort((a, b) => b.createdAt - a.createdAt);
    }

    public getNextId(): number {
        return ++this.id;
    }

    public formatDescription(description): string {
        const firstPhase = description
            .replace(/^( *)/gm, '')
            .replace(/\n/gm, '')
            .replace(/<!\[CDATA\[(.*?)\]\]>/gm, '$1')
            .replace(/&hellip;/g, '...')
            .replace(/&amp;/g, '&')
            // .replace(/<noscript>.*?<\/noscript>/gim, '')
            .replace(/<a.*?href=['"](.*?)['"].*?>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<img.*?src=['"](.*?)['"].*?>/gi, '![]($1)')
            .replace(/<p.*?>/gi, '\n\n')
            .replace(/<(\/?[a-z]+.*?>)/gi, '');

        const secondPhase = firstPhase.replace(/#____\((.*?)\)#____/g, (match, p1) => {
            // return `_(${Utils.getHumanHostname(p1)})_ `;
            return '';
        });

        return secondPhase;
    }

    public extractTextAndImagesFromMarkdown(markdown: string, baseUri): [string, ImageData[]] {
        const images: ImageData[] = [];
        const text = markdown.replace(/(\!\[\]\(.*?\))/gi, (uri) => {
            const image: ImageData = {
                uri: baseUri + uri
                        .replace('!', '')
                        .replace('[', '')
                        .replace(']', '')
                        .replace('(', '')
                        .replace(')', ''),
            }
            images.push(image);
            return '';
        });
        return [text, images];
    }

    private async loadFeed(feedUrl: string): Promise<FeedWithMetrics | null> {
        try {
            const rss = await Feed.fetch(feedUrl);
            return rss;
        } catch (e) {
            console.log(e, feedUrl);
            return null;
        }
    }

    private convertRSSFeedtoPosts(rssFeed: RSSFeed, feedName: string, favicon: string): Post[] {
        console.log('RSS items: ', rssFeed.items);
        const posts = rssFeed.items.map(item => {
            const description = this.formatDescription(item.description);
            const [text, images] = this.extractTextAndImagesFromMarkdown(description, '');
            const title = item.title === '(Untitled)' ? '' : '**' + item.title + '**' + '\n\n';
            const post: Post = {
                _id: this.getNextId(),
                text: title + text + '\n\n',
                createdAt: item.created,
                images: images,
                link:  item.link,
                author: {
                    name: feedName,
                    uri: rssFeed.url,
                    faviconUri: favicon,
                },
            };
            return post;
        });

        return posts;
    }
}

export const RSSPostManager = new _RSSPostManager();

const util = require('react-native-util');
const xml2js = require('react-native-xml2js');

const Feed = {
    DefaultTimeout: 5000,
    fetch: async (url): Promise<FeedWithMetrics> => {
        const startTime = Date.now();
        const response = await Utils.timeout(Feed.DefaultTimeout, fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
                'Accept': 'text/html,application/xhtml+xml',
            },
        }));
        const downloadTime = Date.now();
        if (response.status === 200) {
            const xml = await response.text();
            return Feed.load(url, xml, startTime, downloadTime);
        } else {
            throw new Error('Bad status code');
        }
    },

    load: async (url, xml, startTime = 0, downloadTime = 0): Promise<FeedWithMetrics> => {
        const xmlTime = Date.now();
        const parser = new xml2js.Parser({ trim: false, normalize: true, mergeAttrs: true });
        parser.addListener('error', (err) => {
            throw new Error(err);
        });
        return await new Promise<FeedWithMetrics>((resolve, reject) => {
            parser.parseString(xml, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                const parseTime = Date.now();
                const rss = Feed.parser(result);
                const feedWithMetrics: FeedWithMetrics = {
                    feed: rss,
                    url: url,
                    size: xml.length,
                    downloadTime: downloadTime - startTime,
                    xmlTime: xmlTime - downloadTime,
                    parseTime: parseTime - xmlTime,
                }
                resolve(feedWithMetrics);
            });
        });
    },

    parser: (json) => {
        if (json.feed) {
            return Feed.parseAtom(json);
        } else if (json.rss) {
            return Feed.parseRSS(json);
        }
    },

    parseAtom: (json) => {
        const feed = json.feed;
        const rss: any = { items: [] };

        if (feed.title) {
            rss.title = feed.title[0];
        }
        if (feed.icon) {
            rss.icon = feed.icon[0];
        }
        if (feed.link) {
            rss.url = feed.link[0].href[0];
        }

        rss.items = feed.entry.map(entry => {
            const item: RSSItem = {
                title: entry.title ? entry.title[0] : '',
                description: entry.content ? entry.content[0]._ : '',
                created: entry.published ? DateUtils.parseDateString(entry.published[0]) : Date.now(),
                link: entry.link ? entry.link[0].href[0] : '',
                url: entry.link ? entry.link[0].href[0] : '',
            };
            return item;
        });

        return rss;
    },

    parseRSS: (json) => {
        let channel = json.rss.channel;
        const rss: any = { items: [] };
        if (util.isArray(json.rss.channel)) {
            channel = json.rss.channel[0];
        }
        if (channel.title) {
            rss.title = channel.title[0];
        }
        if (channel.description) {
            rss.description = channel.description[0];
        }
        if (channel.link) {
            rss.url = channel.link[0];
        }
        if (channel.item) {
            if (!util.isArray(channel.item)) {
                channel.item = [channel.item];
            }
            channel.item.forEach((val) => {
                const obj: any = {};
                obj.title = !util.isNullOrUndefined(val.title) ? val.title[0] : '';
                obj.description = !util.isNullOrUndefined(val.description) ? val.description[0] : '';
                obj.url = obj.link = !util.isNullOrUndefined(val.link) ? val.link[0] : '';

                if (val.pubDate) {
                    obj.created = Date.parse(val.pubDate[0]);
                }
                if (val['media:content']) {
                    obj.media = val.media || {};
                    obj.media.content = val['media:content'];
                }
                if (val['media:thumbnail']) {
                    obj.media = val.media || {};
                    obj.media.thumbnail = val['media:thumbnail'];
                }
                if (val.enclosure) {
                    obj.enclosures = [];
                    if (!util.isArray(val.enclosure)) {
                        val.enclosure = [val.enclosure];
                    }
                    val.enclosure.forEach((enclosure) => {
                        const enc = {};
                        for (const x in enclosure) {
                            enc[x] = enclosure[x][0];
                        }
                        obj.enclosures.push(enc);
                    });

                }
                rss.items.push(obj);

            });

        }
        return rss;

    },

};
