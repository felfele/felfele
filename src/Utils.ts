// tslint:disable-next-line:no-var-requires
const Url = require('url');

export class Utils {
    public static async timeout<T>(ms, promise: Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            setTimeout(() => reject(new Error('timeout')), ms);
            promise.then(resolve, reject);
        });
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
}
