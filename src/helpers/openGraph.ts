import { HtmlUtils } from '../HtmlUtils';
import { getCanonicalUrl, getHttpsUrl } from './urlUtils';

export interface OpenGraphData {
    title: string;
    description: string;
    image: string;
    name: string;
    url: string;
}

export const fetchOpenGraphData = async (url: string): Promise<OpenGraphData> => {
    const response = await fetch(url);
    const html = await response.text();
    const data = parseOpenGraphData(html);
    return data;
};

export const parseOpenGraphData = (html: string): OpenGraphData => {
    const document = HtmlUtils.parse(html);
    return getHtmlOpenGraphData(document);
};

export const getHtmlOpenGraphData = (document: HTMLElement): OpenGraphData => {
    const metaElements = HtmlUtils.findPath(document, ['html', 'head', 'meta']);

    const ogData: OpenGraphData = {
        title: '',
        description: '',
        image: '',
        name: '',
        url: '',
    };
    for (const meta of metaElements) {
        ogData.title = getPropertyIfValueNotSet(ogData.title, meta, 'og:title');
        ogData.description = getPropertyIfValueNotSet(ogData.description, meta, 'og:description');
        ogData.image = getPropertyIfValueNotSet(ogData.image, meta, 'og:image');
        ogData.name = getPropertyIfValueNotSet(ogData.name, meta, 'og:site_name');
        ogData.url = getPropertyIfValueNotSet(ogData.url, meta, 'og:url');
    }
    return normalizeOpenGraphData(ogData);
};

const normalizeOpenGraphData = (ogData: OpenGraphData): OpenGraphData => {
    return {
        ...ogData,
        image: getHttpsUrl(getCanonicalUrl(ogData.image)),
    };
};

const getPropertyIfValueNotSet = (value: string, node: Node, name: string): string => {
    return value === ''
        ? getOpenGraphPropertyContent(node, name) || ''
        : value
    ;
};

const getOpenGraphPropertyContent = (node: Node, name: string): string | null => {
    if (HtmlUtils.matchAttributes(node, [{name: 'property', value: name}])) {
        return HtmlUtils.getAttribute(node, 'content');
    }
    return null;
};
