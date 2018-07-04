class _FaviconCache {
    private favicons: Map<string, string> = new Map();

    public async getFavicon(url): Promise<string> {
        if (this.favicons.has(url)) {
            return this.favicons.get(url) || '';
        }
        const baseUrl = this.getBaseUrl(url);
        try {
            const favicon = await this.downloadIndexAndParseFavicon(baseUrl);
            this.favicons.set(url, favicon);
            return favicon;
        } catch (e) {
            console.log(e);
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

    private async downloadIndexAndParseFavicon(url) {
        const defaults = {
            'https://444.hu/': 'https://444.hu/assets/blog/static/444-touch-60x60-9e787b1cc6bb60204e7419276bc82d59.png',
        };

        return defaults.hasOwnProperty(url) ? defaults[url] : url + 'favicon.ico';
    }
}

export const FaviconCache = new _FaviconCache();
