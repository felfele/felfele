import { RSSPostManager } from '../src/RSSPostManager';

beforeEach(() => {
});

afterEach(() => {
});

test('Parse CDATA descriptions from RSS', async () => {
    const text = 'text';
    const description = `<![CDATA[${text}]]>`;
    const expectedResult = text;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse image from RSS', async () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<img src="${link}" alt="">`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse CDATA descriptions containing an image from RSS', async () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<![CDATA[<img src="${link}" alt="">]]>`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse html with image', () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/08/photo-34.jpg';
    const description = `<div><img src="${link}" alt=""></div>`;
    const expectedResult = `![](${link})`;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse image from markdown', () => {
    const link = 'http://192.168.1.49:2368/content/images/2017/07/photo-33.jpg'
    const markdown = `![](${link})`;
    const expectedResult = ['', [{uri: link}]];

    const result = RSSPostManager.extractTextAndImagesFromMarkdown(markdown, '');

    expect(result).toEqual(expectedResult);
})

test('Parse link', () => {
    const hostname = 'example.com';
    const link = `http://${hostname}/content/2017/08/`;
    const description = `<a href="${link}">description</a>`;
    const expectedResult = `[description](${link}) _(${hostname})_ `;

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

test('Parse description with multiline CDATA', () => {
    const description = `
    <![CDATA[
    a
    ]]>
    `;
    const expectedResult = 'a';

    const result = RSSPostManager.formatDescription(description);

    expect(result).toBe(expectedResult);
})

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
})
