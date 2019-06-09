import { parseOpenGraphData } from '../../src/helpers/openGraph';

test('open graph data parsing from html', () => {
    const title = 'title';
    const description = 'description';
    const image = 'https://image/';
    const name = 'name';
    const url = 'url';
    const input = `
        <html><head>
            <meta property='og:title' content='${title}'>
            <meta property='og:description' content='${description}'>
            <meta property='og:image' content='${image}'>
            <meta property='og:site_name' content='${name}'>
            <meta property='og:url' content='${url}'>
        </head></html>
    `;
    const result = parseOpenGraphData(input);

    expect(result.title).toEqual(title);
    expect(result.description).toEqual(description);
    expect(result.image).toEqual(image);
    expect(result.name).toEqual(name);
    expect(result.url).toEqual(url);
});
