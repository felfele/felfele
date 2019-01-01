import * as React from 'react';
import * as ShallowRenderer from 'react-test-renderer/shallow';
import { Card, CardWithText } from '../../src/components/Card';
import { Author, Post } from '../../src/models/Post';
import TestRenderer from 'react-test-renderer';

jest.mock('react-native-fs', () => {
    return {
        mkdir: jest.fn(),
        moveFile: jest.fn(),
        copyFile: jest.fn(),
        pathForBundle: jest.fn(),
        pathForGroup: jest.fn(),
        getFSInfo: jest.fn(),
        getAllExternalFilesDirs: jest.fn(),
        unlink: jest.fn(),
        exists: jest.fn(),
        stopDownload: jest.fn(),
        resumeDownload: jest.fn(),
        isResumable: jest.fn(),
        stopUpload: jest.fn(),
        completeHandlerIOS: jest.fn(),
        readDir: jest.fn(),
        readDirAssets: jest.fn(),
        existsAssets: jest.fn(),
        readdir: jest.fn(),
        setReadable: jest.fn(),
        stat: jest.fn(),
        readFile: jest.fn(),
        read: jest.fn(),
        readFileAssets: jest.fn(),
        hash: jest.fn(),
        copyFileAssets: jest.fn(),
        copyFileAssetsIOS: jest.fn(),
        copyAssetsVideoIOS: jest.fn(),
        writeFile: jest.fn(),
        appendFile: jest.fn(),
        write: jest.fn(),
        downloadFile: jest.fn(),
        uploadFiles: jest.fn(),
        touch: jest.fn(),
        MainBundlePath: jest.fn(),
        CachesDirectoryPath: jest.fn(),
        DocumentDirectoryPath: jest.fn(),
        ExternalDirectoryPath: jest.fn(),
        ExternalStorageDirectoryPath: jest.fn(),
        TemporaryDirectoryPath: jest.fn(),
        LibraryDirectoryPath: jest.fn(),
        PicturesDirectoryPath: jest.fn(),
    };
});

const testAuthor: Author = {
    faviconUri: '',
    name: 'Test Elek',
    uri: '',
    image: {},
};

const testPostWithoutImage: Post = {
    _id: 0,
    createdAt: Date.now(),
    images: [],
    text: `This is a basic test post:

Let's see if we can assert something useful.`,
    author: testAuthor,
};

const testPostWithImage: Post = {
    _id: 0,
    createdAt: Date.now(),
    images: [{ uri: 'test-image-uri' }],
    text: `This is a basic test post:

Let's see if we can assert something useful.`,
    author: testAuthor,
};

it('should render without images CardWithText', () => {
    const renderer = ShallowRenderer.createRenderer();
    renderer.render(
        <Card
            post={testPostWithoutImage}
            isSelected={false}
            navigate={(_) => {}}
            onDeletePost={(_) => {}}
            onSharePost={(_) => {}}
            togglePostSelection={(_) => {}}
            showSquareImages={true}
        />
    );

    const result = renderer.getRenderOutput();
    expect(result.type).toBe(CardWithText);
});

it('should render unselected post without images with the following components: Post, CardTop, without CardButtonList', () => {
    const result = TestRenderer.create(
        <Card
            post={testPostWithoutImage}
            isSelected={false}
            navigate={(_) => {}}
            onDeletePost={(_) => {}}
            onSharePost={(_) => {}}
            togglePostSelection={(_) => {}}
            showSquareImages={true}
        />
    ).root;
    console.log(result.props);
    expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
    expect(result.findByProps({ testID: 'CardTop' }));
    expect(result.findAllByProps({ testID: 'CardButtonList' }).length).toEqual(0);
});

it('should render selected post without images with the following components: Post, CardTop, CardButtonList', () => {
    const result = TestRenderer.create(
        <Card
            post={testPostWithoutImage}
            isSelected={true}
            navigate={(_) => {}}
            onDeletePost={(_) => {}}
            onSharePost={(_) => {}}
            togglePostSelection={(_) => {}}
            showSquareImages={true}
        />
    ).root;
    console.log(result.props);
    expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
    expect(result.findByProps({ testID: 'CardTop' }));
    expect(result.findAllByProps({ testID: 'CardButtonList' }));
});

it('should render unselected post with images with the following components: Post, CardTop, Image, without CardButtonList', () => {
    const result = TestRenderer.create(
        <Card
            post={testPostWithImage}
            isSelected={false}
            navigate={(_) => {}}
            onDeletePost={(_) => {}}
            onSharePost={(_) => {}}
            togglePostSelection={(_) => {}}
            showSquareImages={true}
        />
    ).root;
    console.log(result.props);
    expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
    expect(result.findByProps({ testID: 'CardTop' }));
    expect(result.findByProps({ testID: 'test-image-uri' }));
    expect(result.findAllByProps({ testID: 'CardButtonList' }).length).toEqual(0);
});

it('should render selected post with images with the following components: Post, CardTop, Image, CardButtonList', () => {
    const result = TestRenderer.create(
        <Card
            post={testPostWithImage}
            isSelected={false}
            navigate={(_) => {}}
            onDeletePost={(_) => {}}
            onSharePost={(_) => {}}
            togglePostSelection={(_) => {}}
            showSquareImages={true}
        />
    ).root;
    console.log(result.props);
    expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
    expect(result.findByProps({ testID: 'CardTop' }));
    expect(result.findByProps({ testID: 'test-image-uri' }));
    expect(result.findAllByProps({ testID: 'CardButtonList' }).length).toEqual(0);
});
