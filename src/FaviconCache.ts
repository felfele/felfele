import { HtmlUtils } from './HtmlUtils';
import { Debug } from './Debug';
import { safeFetch } from './Network';
import * as urlUtils from './helpers/urlUtils';

interface Icon {
    href: string;
    size: number;
}

// tslint:disable:class-name
class _FaviconCache {
    private favicons: Map<string, string> = new Map();

    public async getFavicon(url: string): Promise<string> {
        if (this.favicons.has(url)) {
            return this.favicons.get(url) || '';
        }
        const baseUrl = this.getBaseUrl(url);
        try {
            const favicon = urlUtils.getHumanHostname(url) === urlUtils.REDDIT_COM
                ? await this.downloadSubRedditAboutJsonAndParseFavicon(url)
                : await this.downloadIndexAndParseFavicon(baseUrl)
            ;
            Debug.log('getFavicon: ', favicon);
            this.favicons.set(url, favicon);
            return favicon;
        } catch (e) {
            Debug.log(e);
            return '';
        }
    }

    public findBestIconFromLinks = (links: Node[]): string | undefined => {
        const icons = this.findIconsInLinks(links);
        console.log('findBestIconFromLinks', {icons});
        const icon = this.getBestIcon(icons);
        return icon != null
            ? icon.href
            : undefined
        ;
    }

    private getBaseUrl(url: string) {
        let baseUrl = url.replace(/(http(s)?:\/\/.*?\/).*/, '$1');
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        return baseUrl;
    }

    private async fetchHtml(url: string): Promise<string> {
        const response = await safeFetch(url);
        const html = await response.text();
        return html;

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

    private async downloadSubRedditAboutJsonAndParseFavicon(url: string): Promise<string> {
        const jsonUrl = url.slice(0, -4).concat('/about.json');
        const jsonText = await this.fetchHtml(jsonUrl);
        const json = JSON.parse(jsonText);
        return json.data.icon_img;
    }

    private getBestSizeFromAttribute = (sizesAttr: string): number => {
        const getSize = (sizeAttr: string) => parseInt(sizeAttr.split(/[xX]/)[0], 10) || 0;
        const sizes = sizesAttr.split(' ')
            .map(size => getSize(size))
            .sort((a, b) => b - a)
        ;
        return sizes.length > 0
            ? sizes[0]
            : 0
        ;
    }

    private findIconsInLinks = (links: Node[]): Icon[] => {
        const isIcon = (icon: Partial<Icon>): icon is Icon => icon.href != null && icon.size != null;
        return links.map(link => {
            const href = this.matchRelAttributes(link, ['shortcut icon', 'icon', 'apple-touch-icon']) || undefined;
            const sizes = HtmlUtils.getAttribute(link, 'sizes') || '';
            const size = this.getBestSizeFromAttribute(sizes);
            return {
                href,
                size,
            };
        })
        .filter<Icon>(isIcon);
    }

    private getBestIcon = (icons: Icon[]): Icon | undefined => {
        const iconExtensionWeight = (iconHref: string) => iconHref.endsWith('.png')
            ? 2
            : iconHref.endsWith('.ico')
                ? 1
                : 0
        ;
        const compareIconExtension = (a: string, b: string) => iconExtensionWeight(b) - iconExtensionWeight(a);
        const sortedIcons = icons.sort((a, b) => b.size - a.size || compareIconExtension(a.href, b.href));
        return sortedIcons.length > 0
            ? sortedIcons[0]
            : undefined
        ;
    }

    private async downloadIndexAndParseFavicon(url: string): Promise<string> {
        const html = await this.fetchHtml(url);
        const document = HtmlUtils.parse(html);
        const links = HtmlUtils.findPath(document, ['html', 'head', 'link']);
        const favicon = this.findBestIconFromLinks(links);
        if (favicon != null) {
            if (favicon.startsWith('//')) {
                return 'https:' + favicon;
            }
            if (!favicon.startsWith('http')) {
                return url + favicon;
            }
            return favicon;
        }

        return url + 'favicon.ico';
    }
}

export const FaviconCache = new _FaviconCache();
