import { HtmlUtils } from './HtmlUtils';
import { Debug } from './Debug';
import { safeFetch } from './Network';

export class CachingFaviconParserStatic {
    private favicons: Map<string, string> = new Map();

    public async getFavicon(url: string, fetchFunction = safeFetch): Promise<string> {
        if (this.favicons.has(url)) {
            return this.favicons.get(url) || '';
        }
        const baseUrl = this.getBaseUrl(url);
        try {
            const favicon = await this.downloadIndexAndParseFavicon(baseUrl, fetchFunction);
            Debug.log('getFavicon: ', favicon);
            this.favicons.set(url, favicon);
            return favicon;
        } catch (e) {
            Debug.log(e);
            return '';
        }
    }

    private getBaseUrl(url: string) {
        let baseUrl = url.replace(/(http(s)?:\/\/.*?\/).*/, '$1');
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        return baseUrl;
    }

    private matchRelAttributes(node: Node, values: string[]): string | null {
        for (const value of values) {
            if (HtmlUtils.matchAttributes(node, [{name: 'rel', value: value}])) {
                const favicon = HtmlUtils.getAttribute(node, 'href') || '';
                if (favicon !== '') {
                    return favicon;
                }
            }
        }
        return null;
    }

    private async downloadIndexAndParseFavicon(url, fetchFunction) {
        const response = await fetchFunction(url);
        const html = await response.text();
        const document = HtmlUtils.parse(html);
        const links = HtmlUtils.findPath(document, ['html', 'head', 'link']);
        for (const link of links) {
            const icon = this.matchRelAttributes(link, ['shortcut icon', 'icon', 'apple-touch-icon']);
            if (icon != null) {
                if (icon.startsWith('//')) {
                    return 'https:' + icon;
                }
                if (!icon.startsWith('http')) {
                    return url + icon;
                }
                return icon;
            }
        }

        return url + 'favicon.ico';
    }
}

export const CachingFaviconParser = new CachingFaviconParserStatic();
