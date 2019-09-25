import { PostListDict } from '../../src/reducers/version4';
import { PrivatePostActions } from '../../src/actions/PrivatePostActions';
import { HexString } from '../../src/helpers/opaqueTypes';
import { PrivatePost, Post } from '../../src/models/Post';
import { privatePostsReducer } from '../../src/reducers/privatePostsReducer';

describe('privatePostsReducer', () => {
    describe('addPrivatePost', () => {
        it('should work with empty privatePosts', () => {
            const privatePosts: PostListDict = {};
            const topic = '' as HexString;
            const privatePost: PrivatePost = {
                text: 'hello',
                createdAt: 0,
                images: [],
                topic,
                author: {
                    name: '',
                    uri: '',
                    image: {},
                },
                _id: '' as HexString,
            };
            const action = PrivatePostActions.addPrivatePost(topic, privatePost);
            const result = privatePostsReducer(privatePosts, action);

            expect(topic in result).toBeTruthy();
            expect(result[topic].length).toBe(1);
            expect(result[topic][0]).toBe(privatePost);
        });

        it('should work with existing topic', () => {
            const privatePosts: PostListDict = {};
            const topic = '' as HexString;
            const privatePost1: PrivatePost = {
                text: 'hello1',
                createdAt: 0,
                images: [],
                topic,
                author: {
                    name: '',
                    uri: '',
                    image: {},
                },
                _id: '' as HexString,
            };
            const privatePost2 = {
                ...privatePost1,
                text: 'hello2',
            };
            const action1 = PrivatePostActions.addPrivatePost(topic, privatePost1);
            const afterAction1 = privatePostsReducer(privatePosts, action1);
            const action2 = PrivatePostActions.addPrivatePost(topic, privatePost2);
            const result = privatePostsReducer(afterAction1, action2);

            expect(topic in result).toBeTruthy();
            expect(result[topic].length).toBe(2);
            expect(result[topic][0]).toBe(privatePost2);
            expect(result[topic][1]).toBe(privatePost1);
        });
    });

    describe('removePrivatePost', () => {
        it('should work with empty privatePosts', () => {
            const privatePosts: PostListDict = {};
            const topic = '' as HexString;
            const id = '' as HexString;
            const action = PrivatePostActions.removePrivatePost(topic, id);
            const result = privatePostsReducer(privatePosts, action);

            expect(result).toEqual(privatePosts);
        });

        it('should work with non-existing topic', () => {
            const privatePosts: PostListDict = {
                ['a']: [],
            };
            const topic = '' as HexString;
            const id = '' as HexString;
            const action = PrivatePostActions.removePrivatePost(topic, id);
            const result = privatePostsReducer(privatePosts, action);

            expect(result).toEqual(privatePosts);
        });

        it('should work with non-existing id', () => {
            const privatePosts: PostListDict = {
                ['a']: [],
            };
            const topic = 'a' as HexString;
            const id = '' as HexString;
            const action = PrivatePostActions.removePrivatePost(topic, id);
            const result = privatePostsReducer(privatePosts, action);

            expect(result).toEqual(privatePosts);
        });

        it('should delete post with id', () => {
            const topic = 'a' as HexString;
            const id = 'b' as HexString;
            const privatePost: PrivatePost = {
                text: 'hello1',
                createdAt: 0,
                images: [],
                topic,
                author: {
                    name: '',
                    uri: '',
                    image: {},
                },
                _id: id,
            };
            const privatePosts: PostListDict = {
                ['a']: [privatePost],
            };
            const action = PrivatePostActions.removePrivatePost(topic, id);
            const result = privatePostsReducer(privatePosts, action);

            expect(result[topic].length).toBe(0);
        });
    });

    describe('removePrivatePostsWithTopic', () => {
        it('should remove topic if exists', () => {
            const topic = 'a' as HexString;
            const privatePosts: PostListDict = {
                [topic]: [],
            };
            const action = PrivatePostActions.removePrivatePostsWithTopic(topic);
            const result = privatePostsReducer(privatePosts, action);

            expect(result[topic]).toBeUndefined();
        });
        it('should work even if  the topic does not exist', () => {
            const topic = 'a' as HexString;
            const privatePosts: PostListDict = {};
            const action = PrivatePostActions.removePrivatePostsWithTopic(topic);
            const result = privatePostsReducer(privatePosts, action);

            expect(result[topic]).toBeUndefined();
        });
        it('should not remove topic with different key', () => {
            const topicA = 'a' as HexString;
            const topicB = 'b' as HexString;
            const privatePosts: PostListDict = {
                [topicB]: [],
            };

            const action = PrivatePostActions.removePrivatePostsWithTopic(topicA);
            const result = privatePostsReducer(privatePosts, action);
            expect(result[topicB]).toEqual([]);

        });
    });
});
