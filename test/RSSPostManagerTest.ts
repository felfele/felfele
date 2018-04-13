import { RSSPostManager, RSSFeedManager } from '../src/RSSPostManager';

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

test('Parse description with CDATA', () => {
    const description = `
    <![CDATA[<figure style="width:4630px" class="jeti-image"><a style="padding-bottom:62%" class="jeti-image__placeholder" href="https://4cdn.hu/kraken/image/upload/s--_GuWdMvw--/74AKzyxT7VU11Cgjys.jpeg" rel="nofollow"><noscript><img src="https://4cdn.hu/kraken/image/upload/s--Vn5aUKc_--/c_limit,w_1160/74AKzyxT7VU11Cgjys.jpeg" srcset="https://4cdn.hu/kraken/image/upload/s--7M-ymoO_--/w_290/74AKzyxT7VU11Cgjys.jpeg 290w, https://4cdn.hu/kraken/image/upload/s--4HaX3iM5--/w_330/74AKzyxT7VU11Cgjys.jpeg 330w, https://4cdn.hu/kraken/image/upload/s--nMkbLai6--/w_748/74AKzyxT7VU11Cgjys.jpeg 748w, https://4cdn.hu/kraken/image/upload/s--SHYDzCuU--/w_994/74AKzyxT7VU11Cgjys.jpeg 994w, https://4cdn.hu/kraken/image/upload/s--oKpWi5gB--/w_1160/74AKzyxT7VU11Cgjys.jpeg 1160w" sizes="(max-width: 320px) 290px, (max-width: 360px) 330px,
                                (max-width: 768px) 748px, (max-width: 1024px) 994px, 1160px"></noscript></a><figcaption><svg xmlns="http://www.w3.org/2000/svg" version="1.1" preserveaspectratio="xMidYMid" class="icon icon-photocamera">
        <use xlink:href="/assets/blog/static/icon-defs.svg#icon-photocamera"></use>
    </svg><span></span><span class="jeti-image__credit">Fotó: Máthé Zoltán/MTI/MTVA</span></figcaption></figure><p>Az <i>Egészség Hídja Összefogás a Mellrák Ellen</i> és a <i>MentsManust! – Movember Magyarország</i> közös akcióján a rózsaszín és kék színekkel megvilágított hídon mentek át, hogy felhívják a figyelmet a mellrák és a prosztatarák szűrővizsgálatainak fontosságára és az egészséges életvitelre. Nyitott kapukat döngetnek, hiszen Magyarország onkológiai kórházat épít – <a href="https://444.hu/2017/09/25/orban-pont-abban-a-varosban-es-pont-annyiert-epit-korhazat-vietnamben-mint-amit-annak-idejen-bajnai-szervezett-le" target="_blank">Vietnamban</a>.<br></p>]]>
    `;
    const expectedResult = description;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
});

test('Fetch RSS feed from URL', async () => {
    const baseUrl = 'https://index.hu/';
    const expectedFeedUrl = 'https://index.hu/24ora/rss/';
    const result = await RSSFeedManager.getFeedFromHtml(baseUrl, indexHtmlContent);

    expect(result).not.toBeNull();
    if (result != null ) {
        expect(result.feedUrl).toBe(expectedFeedUrl);
    }
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
