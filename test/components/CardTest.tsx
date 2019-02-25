import * as React from 'react';
import * as ShallowRenderer from 'react-test-renderer/shallow';
import { Card } from '../../src/components/Card';
import { Author, Post } from '../../src/models/Post';
import TestRenderer from 'react-test-renderer';
import { ReactNativeModelHelper } from '../../src/models/ReactNativeModelHelper';

jest.mock('../../src/models/ReactNativeModelHelper');

describe('card test', () => {
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

    const modelHelper = new ReactNativeModelHelper();

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
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
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
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
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
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
            />
        ).root;
        console.log(result.props);
        expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
        expect(result.findByProps({ testID: 'CardTop' }));
        expect(result.findByProps({ testID: 'test-image-uri' + '0'}));
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
                currentTimestamp={0}
                author={testAuthor}
                modelHelper={modelHelper}
            />
        ).root;
        console.log(result.props);
        expect(result.findByProps({ testID: `YourFeed/Post${result.props.post._id}` }));
        expect(result.findByProps({ testID: 'CardTop' }));
        expect(result.findByProps({ testID: 'test-image-uri' + '0'}));
        expect(result.findAllByProps({ testID: 'CardButtonList' }).length).toEqual(0);
    });

});
