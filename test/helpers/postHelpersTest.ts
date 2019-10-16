import { mergeUpdatedPosts, isChildrenPostUploading, makePostId } from '../../src/helpers/postHelpers';
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

test('is children post uploading', () => {
    const authorA: Author = {
        name: 'A',
        uri: 'A',
        image: {},
    };
    const link = 'post1';
    const post: Post = {
        images: [],
        text: '',
        createdAt: 1,
        link,
        author: authorA,
    };
    const localPosts: Post[] = [{
        images: [],
        text: '',
        createdAt: 2,
        isUploading: true,
        references: {
            parent: link,
            original: link,
            originalAuthor: authorA,
        },
    }];

    const isUploading = isChildrenPostUploading(post, localPosts);

    expect(isUploading).toBeTruthy();
});

test('is children post uploading when first is not uploading but second is', () => {
    const authorA: Author = {
        name: 'A',
        uri: 'A',
        image: {},
    };
    const link = 'post1';
    const post: Post = {
        images: [],
        text: '',
        createdAt: 1,
        link,
        author: authorA,
    };
    const localPosts: Post[] = [{
        images: [],
        text: '',
        createdAt: 2,
        references: {
            parent: link,
            original: link,
            originalAuthor: authorA,
        },
    }, {
        images: [],
        text: '',
        createdAt: 2,
        isUploading: true,
        references: {
            parent: link,
            original: link,
            originalAuthor: authorA,
        },
    }];

    const isUploading = isChildrenPostUploading(post, localPosts);

    expect(isUploading).toBeTruthy();
});

test('is children post not uploading', () => {
    const authorA: Author = {
        name: 'A',
        uri: 'A',
        image: {},
    };
    const link = 'post1';
    const post: Post = {
        images: [],
        text: '',
        createdAt: 1,
        link,
        author: authorA,
    };
    const localPosts: Post[] = [{
        images: [],
        text: '',
        createdAt: 2,
        references: {
            parent: link,
            original: link,
            originalAuthor: authorA,
        },
    }];

    const isUploading = isChildrenPostUploading(post, localPosts);

    expect(isUploading).toBeFalsy();
});

test('is post uploading but children post not uploading', () => {
    const authorA: Author = {
        name: 'A',
        uri: 'A',
        image: {},
    };
    const link = 'post1';
    const post: Post = {
        images: [],
        text: '',
        createdAt: 1,
        link,
        author: authorA,
        isUploading: true,
    };
    const localPosts: Post[] = [{
        images: [],
        text: '',
        createdAt: 2,
        references: {
            parent: link,
            original: link,
            originalAuthor: authorA,
        },
    }];

    const isUploading = isChildrenPostUploading(post, localPosts);

    expect(isUploading).toBeFalsy();
});

describe('post id generation', () => {
    it('generates an id', () => {
        const post: Post = {
            images: [],
            text: '',
            createdAt: 1,
        };

        const id = makePostId(post);

        expect(id).toBe('76e1f329fdd75682f63a26739d1bdc6c9c51f79fcae10e0ee82195383d792396');
    });
    it('generates the same id with other properties', () => {
        const authorA: Author = {
            name: 'A',
            uri: 'A',
            image: {},
        };
        const link = 'post1';
        const post: Post = {
            images: [],
            text: '',
            createdAt: 1,
            link,
            author: authorA,
            isUploading: true,
        };

        const id = makePostId(post);

        expect(id).toBe('76e1f329fdd75682f63a26739d1bdc6c9c51f79fcae10e0ee82195383d792396');
    });
    it('generates same id with different image', () => {
        const image = {
            uri: 'uri',
        };
        const post: Post = {
            images: [image],
            text: '',
            createdAt: 1,
        };

        const id = makePostId(post);

        expect(id).toBe('76e1f329fdd75682f63a26739d1bdc6c9c51f79fcae10e0ee82195383d792396');
    });
});
