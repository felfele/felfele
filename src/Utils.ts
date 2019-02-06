// tslint:disable-next-line:no-var-requires
const Url = require('url');

export class Utils {
    public static async timeout<T>(ms, promise: Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (ms > 0) {
                setTimeout(() => reject(new Error('timeout')), ms);
            }
            promise.then(resolve, reject);
        });
    }

    public static async waitMillisec(ms: number): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            if (ms > 0) {
                setTimeout(() => resolve(ms), ms);
            }
        });
    }

    public static async waitUntil(untilTimestamp: number, now: number = Date.now()): Promise<number> {
        const diff = untilTimestamp - now;
        if (diff > 0) {
            return Utils.waitMillisec(diff);
        }
        return 0;
    }

    public static take(list, num, defaultReturn) {
        if (list.length < num) {
            return [defaultReturn];
        }
        return list.slice(0, num);
    }

    public static takeLast(list, num, defaultReturn) {
        if (list.length < num) {
            return [defaultReturn];
        }
        return list.slice(list.length - num);
    }

    public static getHumanHostname(url: string): string {
        if (url.startsWith('//')) {
            url = 'https:' + url;
        }
        const hostname = Url.parse(url).hostname;
        const parts = hostname ? hostname.split('.') : '';
        const humanHostname = Utils.takeLast(parts, 2, '').join('.');
        return humanHostname;
    }

    public static createUrlFromUrn(urn: string, baseUrl: string): string {
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        if (urn.startsWith('//')) {
            const parts = baseUrl.split(':', 2);
            const protocol = parts.length > 1 ? parts[0] : 'https';
            return protocol + ':' + urn;
        }
        if (urn.startsWith('http')) {
            return urn;
        }
        if (urn.startsWith('/')) {
            return baseUrl + urn.slice(1);
        }
        return baseUrl + urn;
    }

    public static getBaseUrl(url: string): string {
        if (url.startsWith('//')) {
            url = 'https:' + url;
        }

        return url.replace(/(http.?:\/\/.*?\/).*/, '$1');
    }

    public static getCanonicalUrl(url: string): string {
        const parts = url.split('//', 2);
        if (parts.length === 1) {
            if (!url.includes('/')) {
                url += '/';
            }
        }
        else if (parts.length > 1) {
            if (!parts[1].includes('/')) {
                url += '/';
            }
        }
        if (url.startsWith('//')) {
            url = 'https:' + url;
        }
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        return url;
    }

    public static stripNonAscii(s: string): string {
        return s.replace(/[^\x00-\x7F]/g, '');
    }

    public static getLinkFromText(text: string): string | undefined {
        const httpLink = text.match(/(http.?:\/\/.*?\/)( |$)/);
        if (httpLink != null) {
            return httpLink[1];
        }
        const bzzFeedLink = text.match(/(bzz-feed:\/\?user=0x[a-f0-9]{40})( |$)/);
        if (bzzFeedLink != null) {
            return bzzFeedLink[1];
        }
        const bzzLink = text.match(/(bzz:\/\/[a-f0-9]{64})( |$)/);
        if (bzzLink != null) {
            return bzzLink[1];
        }
        return undefined;
    }
}
