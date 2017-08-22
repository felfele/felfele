import { PostManager } from './PostManager';
import { Post, ImageData } from './models/Post';
import { Config } from './Config';
import { FaviconCache } from './FaviconCache';
import { DateUtils } from './DateUtils';
import { Utils } from './Utils';

type RSSEnclosure = {
    url: string;
    length: string;
    type: string;
}

type RSSItem = {
    title: string;
    description: string;
    link: string;
    url: string;
    created: number;
    enclosures?: RSSEnclosure[];
}

type RSSFeed = {
    title: string;
    description: string;
    url: string;
    icon?: string;
    items: RSSItem[];
}

type FeedWithMetrics = {
    feed: RSSFeed;
    size: number;
    downloadTime: number;
    xmlTime: number;
    parseTime: number;
}

const FirstId = 1;

class _RSSPostManager implements PostManager {
    posts: Post[] = [];
    id = FirstId;
    idCache = {};
    feedUrls: string[] = [
        'https://news.ycombinator.com/rss',
        'https://444.hu/feed',
        // // 'http://index.hu/24ora/rss/', // plain HTTP is not working on iOS
        'http://192.168.1.49:2368/rss/',
        'https://www.theverge.com/rss/frontpage',
    ]

    async saveAndSyncPost(post: Post) {
        // do nothing
    }
    async deletePost(post: Post) {
        // do nothing
    }
    async syncPosts() {
        await this.loadPosts();
    }

    private async loadFeed(feed): Promise<FeedWithMetrics | null> {
        try {
            const rss = await Feed.load(feed);              
            return rss;        
        } catch (e) {
            console.warn(e);
            return null;
        }
    }

    async loadPosts() {
        const startTime = Date.now();
        const posts = [];
        const metrics: FeedWithMetrics[] = [];
        let downloadSize = 0;
        let firstLoad = this.id == FirstId;
        const loadFeedPromises = this.feedUrls.map(url => this.loadFeed(url));
        const feeds = await Promise.all(loadFeedPromises);
        for (const feedWithMetrics of feeds) {
            if (feedWithMetrics) {
                downloadSize += feedWithMetrics.size;
                const rssFeed = feedWithMetrics.feed;
                const favicon = rssFeed.icon ? rssFeed.icon : await FaviconCache.getFavicon(rssFeed.url);
                console.log('RSSPostManager: ', rssFeed, favicon);
                const convertedPosts = this.convertRSSFeedtoPosts(rssFeed, favicon)
                posts.push.apply(posts, convertedPosts);
                metrics.push(feedWithMetrics);
            }
        }


        // Don't update when there are no new posts, e.g. when the network is down
        if (!firstLoad && posts.length == 0) {
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

    getAllPosts(): Post[] {
        return this.posts.sort((a, b) => b.createdAt - a.createdAt);
    }

    getNextId(): number {
        return ++this.id;
    }

    formatDescription(description): string {
        const firstPhase = description
            .replace(/<!\[CDATA\[(.*)\]\]>/, '$1')
            .replace(/&hellip;/g, '...')
            .replace(/&amp;/g, '&')
            .replace(/<a.*?href=['"](.*?)['"].*?>(.*?)<\/a>/gi, '[$2]($1) #____($1)#____')
            .replace(/<img.*?src=['"](.*?)['"].*\/?>/gi, '![]($1)')
            .replace(/<(\/?[a-z]+.*?>)/gi, '');

        const secondPhase = firstPhase.replace(/#____\((.*?)\)#____/g, (match, p1) => {
            return `_(${Utils.getHumanHostname(p1)})_`;
        });

        return secondPhase;
    }

    extractTextAndImagesFromMarkdown(markdown: string, baseUri = Config.baseUri): [string, ImageData[]] {
        let images: ImageData[] = [];
        const text = markdown.replace(/(\!\[\]\(.*?\))/gi, (uri) => {
            const image: ImageData = {
                uri: baseUri + uri
                        .replace('!', '')
                        .replace('[', '')
                        .replace(']', '')
                        .replace('(', '')
                        .replace(')', '')
            }
            images.push(image);
            return '';
        });
        return [text, images];
    }

    private convertRSSFeedtoPosts(rssFeed: RSSFeed, favicon: string): Post[] {
        console.log('RSS items: ', rssFeed.items);
        const posts = rssFeed.items.map(item => {
            const description = this.formatDescription(item.description);
            const [text, images] = this.extractTextAndImagesFromMarkdown(description, '');
            const title = item.title == '(Untitled)' ? '' : '**' + item.title + '**' + '\n\n';
            const post: Post = {
                _id: this.getNextId(),
                text: title + text + '\n\n',
                createdAt: item.created,
                images: images,
                link:  item.link,
                author: {
                    name: rssFeed.title,
                    uri: rssFeed.url,
                    faviconUri: favicon,
                }
            }
            return post;
        });

        return posts;
    }
}

export const RSSPostManager = new _RSSPostManager();

const util = require('react-native-util');
const xml2js = require('react-native-xml2js');


const Feed = {
    DefaultTimeout: 3000,
    load: async (url): Promise<FeedWithMetrics> => {
        const startTime = Date.now();
        const response = await Utils.timeout(Feed.DefaultTimeout, fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
                'Accept': 'text/html,application/xhtml+xml'
            }
        }));
        const downloadTime = Date.now();
        if (response.status == 200) {
            const xml = await response.text();
            const xmlTime = Date.now();
            const parser = new xml2js.Parser({ trim: false, normalize: true, mergeAttrs: true });
            parser.addListener("error", function (err) {
                throw new Error(err);
            });
            return await new Promise<FeedWithMetrics>((resolve, reject) => {
                parser.parseString(xml, function (err, result) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const parseTime = Date.now();
                    const rss = Feed.parser(result);
                    const feedWithMetrics: FeedWithMetrics = {
                        feed: rss,
                        size: xml.length,
                        downloadTime: downloadTime - startTime,
                        xmlTime: xmlTime - downloadTime,
                        parseTime: parseTime - xmlTime,
                    }
                    resolve(feedWithMetrics);
                });
            });
        } else {
            throw new Error('Bad status code');
        }
    },

    parser: function (json) {
        if (json.feed) {
            return Feed.parseAtom(json);
        } else if (json.rss) {
            return Feed.parseRSS(json);
        }
    },

    parseAtom: function (json) {
        const feed = json.feed;
        var rss: any = { items: [] };

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
            }
            return item;
        })

        return rss;
    },

    parseRSS: function (json) {
        var channel = json.rss.channel;
        var rss: any = { items: [] };
        if (util.isArray(json.rss.channel))
            channel = json.rss.channel[0];

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
            channel.item.forEach(function (val) {
                var obj: any = {};
                obj.title = !util.isNullOrUndefined(val.title) ? val.title[0] : '';
                obj.description = !util.isNullOrUndefined(val.description) ? val.description[0] : '';
                obj.url = obj.link = !util.isNullOrUndefined(val.link) ? val.link[0] : '';

                if (val.pubDate) {
                    //lets try basis js date parsing for now
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
                    if (!util.isArray(val.enclosure))
                        val.enclosure = [val.enclosure];
                    val.enclosure.forEach(function (enclosure) {
                        var enc = {};
                        for (var x in enclosure) {
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
