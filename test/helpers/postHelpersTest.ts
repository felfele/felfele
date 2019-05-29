import { mergeUpdatedPosts } from '../../src/helpers/postHelpers';
import { Post } from '../../src/models/Post';
import { Author } from '../../src/models/Author';

test('merge empty posts results in empty', () => {
    const mergedPosts = mergeUpdatedPosts([], []);

    expect(mergedPosts.length).toBe(0);
});

test('merge empty posts with newer ones', () => {
    const authorA: Author = {
        name: 'A',
        uri: 'A',
        image: {},
    };
    const newPost: Post = {
        images: [],
        text: 'new',
        createdAt: 1,
        author: authorA,
    };

    const mergedPosts = mergeUpdatedPosts([newPost], []);

    expect(mergedPosts.length).toBe(1);
    expect(mergedPosts[0].text).toBe(newPost.text);
    expect(mergedPosts[0].createdAt).toBe(newPost.createdAt);
});

test('merge posts with newer ones', () => {
    const authorA: Author = {
        name: 'A',
        uri: 'A',
        image: {},
    };
    const oldPost: Post = {
        images: [],
        text: 'old',
        createdAt: 0,
        author: authorA,
    };
    const newPost: Post = {
        images: [],
        text: 'new',
        createdAt: 1,
        author: authorA,
    };

    const mergedPosts = mergeUpdatedPosts([newPost], [oldPost]);

    expect(mergedPosts.length).toBe(1);
    expect(mergedPosts[0].text).toBe(newPost.text);
    expect(mergedPosts[0].createdAt).toBe(newPost.createdAt);
});

test('merge posts with multiple author only updates newer ones that matches the author', () => {
    const authorA: Author = {
        name: 'A',
        uri: 'A',
        image: {},
    };
    const oldPostA: Post = {
        images: [],
        text: 'oldA',
        createdAt: 0,
        author: authorA,
    };
    const authorB: Author = {
        name: 'B',
        uri: 'B',
        image: {},
    };
    const oldPostB: Post = {
        images: [],
        text: 'oldB',
        createdAt: 0,
        author: authorB,
    };
    const newPostA: Post = {
        images: [],
        text: 'newA',
        createdAt: 1,
        author: authorA,
    };

    const mergedPosts = mergeUpdatedPosts([newPostA], [oldPostA, oldPostB]);

    expect(mergedPosts.length).toBe(2);
    expect(mergedPosts[0].text).toBe(newPostA.text);
    expect(mergedPosts[1].text).toBe(oldPostB.text);
});
