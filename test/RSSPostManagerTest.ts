import { RSSPostManager, RSSFeedManager } from '../src/RSSPostManager';

jest.mock('../src/FileSystem');

test('Parse CDATA descriptions from RSS', async () => {
    const text = 'text';
    const description = `<![CDATA[${text}]]>`;
    const expectedResult = text;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
});

test('Parse image from RSS', async () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<img src="${link}" alt="">`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
});

test('Parse CDATA descriptions containing an image from RSS', async () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<![CDATA[<img src="${link}" alt="">]]>`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
});

test('Parse html with image', () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<div><img src="${link}" alt=""></div>`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
});

test('Parse image from markdown', () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/07/photo-33.jpg';
    const markdown = `![](${link})`;
    const expectedResult = ['', [{uri: link}]];

    const result = RSSPostManager.extractTextAndImagesFromMarkdown(markdown, '');

    expect(result).toEqual(expectedResult);
});

test('Parse link', () => {
    const hostname = 'example.com';
    const link = `http://${hostname}/content/2017/08/`;
    const description = `<a href="${link}">description</a>`;
    const expectedResult = `[description](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
});

test('Parse description with multiline CDATA', () => {
    const description = `
    <![CDATA[
    a
    ]]>
    `;
    const expectedResult = 'a';

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
});

test('Fetch RSS feed from URL', async () => {
    const baseUrl = 'https://index.hu/';
    const expectedFeedUrl = 'https://index.hu/24ora/rss/';
    const expectedFavicon = 'https://index.hu/assets/images/favicons/apple-touch-icon.png';
    const expectedName = 'Index';

    const result = await RSSFeedManager.getFeedFromHtml(baseUrl, indexHtmlContent);

    expect(result).not.toBeNull();

    if (result != null ) {
        expect(result.feedUrl).toBe(expectedFeedUrl);
        expect(result.favicon).toBe(expectedFavicon);
        expect(result.name).toBe(expectedName);
        expect(result.url).toBe(baseUrl);
    }
});

test('Compare text with title with links removed', () => {
    const title = 'Monvid is based on Blockchain technology and is a decentralized application which relays on streaming nodes provided by the community. Everyone can join this community and share their resources with the platform.↵#ICO #MVID #Monvid';
    const text = 'Monvid is based on Blockchain technology and is a decentralized application which relays on streaming nodes provided by the community. Everyone can join this community and share their resources with the platform.[#ICO](https://twitter.com/hashtag/ICO?src=hash) [#MVID](https://twitter.com/hashtag/MVID?src=hash) [#Monvid](https://twitter.com/hashtag/Monvid?src=hash)';
    const result = RSSPostManager.isTitleSameAsText(title, text);

    expect(result).toBeTruthy();
});

const indexHtmlContent = `
<!DOCTYPE html>
<html class="no-js" lang="hu" prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb#">
<head>
        <title>Index</title>
        <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE11" />
        <!-- [if IE]>
        <meta http-equiv="imagetoolbar" content="no" />
        <meta name="MSSmartTagsPreventParsing" content="true" />
        <meta http-equiv="X-UA-Compatible" content="IE=Edge">
        <![endif]-->
            <meta name="manis:breakpoint" />
    <meta name="manis:breakpoints" />
    <meta name="copyright" content="https://index.hu/copyright/" />
                <meta name="apple-itunes-app" content="app-id=480103271" />
            <meta name="google-play-app" content="app-id=com.aff.index.main" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta property="fb:app_id" content="330827937019153" /><meta property="fb:admins" content="593022362" /><meta property="fb:pages" content="560525343980775,348326671885918" /><meta name="description" content="Magyarország kezdőlapja: gyors hírek, feltárt tények, karcos vélemények. Fontos hírek: választás 2018, térképen a választás, elmúlt nyolc év" /><meta property="og:image" content="https://index.hu/assets/images/facebook_logo.png?v2" /><meta property="article:publisher" content="https://www.facebook.com/Indexhu" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:site" content="@indexhu" /><meta name="twitter:image:src" content="https://index.hu/assets/images/facebook_logo.png" />        <link rel="search" title="Index" type="application/opensearchdescription+xml" href="/assets/static/opensearch.xml" />
    <link rel="copyright" title="Szerzői jogok" href="/copyright/" />
    <link rel="author" title="Impresszum" href="/impresszum/" />
    <link rel="home" title="" href="/" id="homelink" />
        <script type="application/ld+json">
    {
      "@context": "http://schema.org",
      "@type": "WebPage",
      "name": "Index",
      "url": "http://index.hu/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "http://index.hu/24ora?s={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
<link rel="apple-touch-icon" sizes="180x180" href="/assets/images/favicons/apple-touch-icon.png" />
<link rel="icon" type="image/png" href="/assets/images/favicons/favicon-32x32.png" sizes="32x32" />
<link rel="icon" type="image/png" href="/assets/images/favicons/favicon-16x16.png" sizes="16x16" />
<link rel="manifest" href="/assets/images/favicons/manifest.json" />
<link rel="shortcut icon" href="/assets/images/favicons/favicon.ico" />
    <link rel="mask-icon" href="/assets/images/favicons/safari-pinned-tab.svg" color="#ff9900" />
    <meta name="apple-mobile-web-app-title" content="Index" />
    <meta name="application-name" content="Index" />
    <meta name="theme-color" content="#ffffff" />
<script type="text/javascript">var _sf_startpt=(new Date()).getTime()</script>
<link href="https://index.hu/assets/static/indexnew_css/public/global.css?v=1523265960" rel="stylesheet" type="text/css" /><link href="https://index.hu/assets/static/indexnew_css/public/index-global.css?v=1523265960" rel="stylesheet" type="text/css" />            <link rel="stylesheet" type="text/css" href="https://index.hu/assets/static/indexnew_css/public/index-vote.css?v=1523265960" />
            <link rel="stylesheet" type="text/css" href="https://index.hu/assets/static/indexnew_css/public/cimlap.css?v=1523265960" />
            <link rel="stylesheet" type="text/css" href="https://index.hu/assets/static/indexnew_css/public/fixed_header.css?v=1523265960" />
            <link rel="stylesheet" type="text/css" href="https://index.hu/assets/static/pepe/pepe.css?v=1523015470" />
            <link rel="alternate" type="application/rss+xml" title="Legfrissebb cikkeink" href="/24ora/rss/" />
        <meta name="logcustomtarget" content="1" />
        <!-- i0 -->
`;
