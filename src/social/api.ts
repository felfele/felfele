import { Post } from '../models/Post';
import { PostFeed } from '../PostFeed';
import * as Swarm from '../Swarm';
import { serialize } from './serialization';

type PostCommandType = 'update' | 'remove';

interface PostCommand {
    type: PostCommandType;
    post: Post;
    feedUrl?: string;
}

interface PostOptions {
    shareFeedAddress: boolean;
}

export const sharePost = async (
    post: Post,
    yourFeed: PostFeed,
    swarmFeedApi: Swarm.FeedApi,
    options?: PostOptions,
) => {
    await appendPostToFeed({post, type: 'update'}, swarmFeedApi);
};

export const removePost = async (
    post: Post,
    yourFeed: PostFeed,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions,
) => {
    const removedPost: Post = {
        _id: post._id,
        text: '',
        images: [],
        createdAt: post.createdAt,
    };
    await appendPostToFeed({post: removedPost, type: 'remove'}, swarmFeedApi);
};

const appendPostToFeed = async (postCommand: PostCommand, swarmFeedApi: Swarm.FeedApi) => {
    const data = serialize(postCommand);
    swarmFeedApi.update(data);
};

let id = 0;
export const testSharePost = async () => {
    id += 1;
    const privateIdentity = {
        address: '0xde620007c836362d95cab83325b2e0c193653f27',
        privateKey: '0x8879ad8d39cefc71fc33448476eb4e3a38c6286d0922732add0f721759f2a9e0',
        publicKey: '0x04b11f8d252b5906fd57876d0ebb1a91c8368401fe6f65d159523de88d488ff784144c1cce06c396b5e08e0486e836e4b125d1256b18f0ba4823c2c6c7e07f4a78',
    };
    const swarmFeedApi = Swarm.makeFeedApi(privateIdentity);
    const post: Post = {
        _id: id,
        text: 'hello ' + id,
        images: [],
        createdAt: Date.now(),
    };
    const yourFeed: PostFeed = {
        name: 'Test feed',
        url: swarmFeedApi.getUri(),
        feedUrl: swarmFeedApi.getUri(),
        posts: [],
        authorImage: {},
        favicon: '',
    };
    await sharePost(post, yourFeed, swarmFeedApi);
};
