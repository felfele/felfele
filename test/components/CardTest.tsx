import * as React from 'react';
import * as ShallowRenderer from 'react-test-renderer/shallow';
import { Card } from '../../src/components/Card';
import { Post } from '../../src/models/Post';
import { Author } from '../../src/models/Author';
import TestRenderer from 'react-test-renderer';
import { ReactNativeModelHelper } from '../../src/models/ReactNativeModelHelper';
import { Debug } from '../../src/Debug';
import { TypedNavigation } from '../../src/helpers/navigation';

Debug.setDebugMode(true);
jest.mock('../../src/models/ReactNativeModelHelper');
jest.mock('../../src/components/CardMarkdown');
jest.mock('../../src/ui/misc/Carousel');

const mockNavigation: TypedNavigation = {
    goBack: (routeKey?: string | null) => true,
    navigate: (routeKey: any, params: any) => true,
    pop: (n?: number, params?: { immediate?: boolean }) => true,
    popToTop: () => {},
    getParam: (param: any) => param.name,
    setParams: (newParams: any) => true,
};

describe('card test', () => {
    const testAuthor: Author = {
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

    const testPostWithMultipleImages: Post = {
        _id: 0,
        createdAt: Date.now(),
        images: [{ uri: 'test-image-uri-1' }, { uri: 'test-image-uri-2' }, { uri: 'test-image-uri-3' }],
        text: `This is a basic test post:

    Let's see if we can assert something useful.`,
        author: testAuthor,
    };

    const modelHelper = new ReactNativeModelHelper('');

    it('should render unselected post without images with the following components: Post, CardTop, without CardButtonList', () => {
        const result = TestRenderer.create(
            <Card
                post={testPostWithoutImage}
                isSelected={false}
                navigation={mockNavigation}
                onDeletePost={(_) => {}}
                onSharePost={(_) => {}}
                togglePostSelection={(_) => {}}
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
                onDownloadFeedPosts={() => {}}
                originalAuthorFeed={undefined}
                authorFeed={undefined}
            />
        ).root;
        expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
        expect(result.findByProps({ testID: 'CardTop' }));
        expect(result.findAllByProps({ testID: 'CardButtonList' }).length).toEqual(0);
    });

    it('should render selected post without images with the following components: Post, CardTop, CardButtonList', () => {
        const result = TestRenderer.create(
            <Card
                post={testPostWithoutImage}
                isSelected={true}
                navigation={mockNavigation}
                onDeletePost={(_) => {}}
                onSharePost={(_) => {}}
                togglePostSelection={(_) => {}}
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
                onDownloadFeedPosts={() => {}}
                originalAuthorFeed={undefined}
                authorFeed={undefined}
            />
        ).root;
        expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
        expect(result.findByProps({ testID: 'CardTop' }));
        expect(result.findAllByProps({ testID: 'CardButtonList' }));
    });

    it('should render unselected post with image with the following components: Post, CardTop, Image, without CardButtonList', () => {
        const result = TestRenderer.create(
            <Card
                post={testPostWithImage}
                isSelected={false}
                navigation={mockNavigation}
                onDeletePost={(_) => {}}
                onSharePost={(_) => {}}
                togglePostSelection={(_) => {}}
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
                onDownloadFeedPosts={() => {}}
                originalAuthorFeed={undefined}
                authorFeed={undefined}
            />
        ).root;
        expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
        expect(result.findByProps({ testID: 'CardTop' }));
        expect(result.findByProps({ testID: 'test-image-uri' }));
        expect(result.findAllByProps({ testID: 'CardButtonList' }).length).toEqual(0);
    });

    it('should render unselected post with multiple images with the following components: Post, CardTop, Carousel, without CardButtonList', () => {
        const result = TestRenderer.create(
            <Card
                post={testPostWithMultipleImages}
                isSelected={false}
                navigation={mockNavigation}
                onDeletePost={(_) => {}}
                onSharePost={(_) => {}}
                togglePostSelection={(_) => {}}
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
                onDownloadFeedPosts={() => {}}
                originalAuthorFeed={undefined}
                authorFeed={undefined}
            />
        ).root;
        expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
        expect(result.findByProps({ testID: 'CardTop' }));
        expect(result.findByProps({ testID: 'carousel' }));
        expect(result.findAllByProps({ testID: 'CardButtonList' }).length).toEqual(0);
    });

    it('should render selected post with image with the following components: Post, CardTop, Image, CardButtonList', () => {
        const result = TestRenderer.create(
            <Card
                post={testPostWithImage}
                isSelected={false}
                navigation={mockNavigation}
                onDeletePost={(_) => {}}
                onSharePost={(_) => {}}
                togglePostSelection={(_) => {}}
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
                onDownloadFeedPosts={() => {}}
                originalAuthorFeed={undefined}
                authorFeed={undefined}
            />
        ).root;
        expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
        expect(result.findByProps({ testID: 'CardTop' }));
        expect(result.findByProps({ testID: 'test-image-uri' }));
        expect(result.findAllByProps({ testID: 'CardButtonList' }).length).toEqual(0);
    });

});
