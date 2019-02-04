import { Post } from '../models/Post';
import { ImageData } from '../models/ImageData';
import * as Swarm from '../Swarm';
import { serialize, deserialize } from './serialization';
import { uploadPost } from '../PostUpload';
import { ModelHelper } from '../models/ModelHelper';
import { MockModelHelper } from '../models/__mocks__/ModelHelper';
import { Debug } from '../Debug';

type PostCommandType = 'update' | 'remove';

const PostCommandProtocolVersion = 1;

interface PostCommand {
    protocolVersion: number;

    timestamp: number;
    parentTimestamp: number;

    type: PostCommandType;
    post: Post;

    previousEpoch?: Swarm.Epoch;
    _epoch?: Swarm.Epoch;
}

interface PostCommandLog {
    commands: PostCommand[];
}

interface PostOptions {
    shareFeedAddress: boolean;
    imageResizer: (image: ImageData, path: string) => Promise<string>;
    modelHelper: ModelHelper;
}

const DefaultImageResizer = (image: ImageData, path: string): Promise<string> => {
    return Promise.resolve(path);
};

const DefaultPostOptions: PostOptions = {
    shareFeedAddress: false,
    imageResizer: DefaultImageResizer,
    modelHelper: new MockModelHelper(),
};

const getPreviousPostCommandTimestampFromLog = (postCommandLog: PostCommandLog): number => {
    if (postCommandLog.commands.length === 0) {
        return 0;
    }
    return postCommandLog.commands[0].timestamp;
};

const getPreviousCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    if (postCommandLog.commands.length === 0) {
        return undefined;
    }
    return postCommandLog.commands[0]._epoch;
};

const getParentUpdateTimestampFromLog = (post: Post, postCommandLog: PostCommandLog): number => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.post._id === post._id) {
            return postCommand.timestamp;
        }
    }
    return 0;
};

export const shareNewPost = async (
    post: Post,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions = DefaultPostOptions,
): Promise<PostCommandLog> => {
    const uploadedPost = await uploadPost(post, options.imageResizer, options.modelHelper);
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getPreviousPostCommandTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp: 0,
        post: uploadedPost,
        type: 'update',
        previousEpoch,
        _epoch: undefined,
    };
    const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarmFeedApi);
    return {
        ...postCommandLog,
        commands: [uploadedPostCommand, ...postCommandLog.commands],
    };
};

export const updatePost = async (
    post: Post,
    postCommandLog: PostCommandLog,
    swarmFeedApi: Swarm.FeedApi,
    options: PostOptions = DefaultPostOptions,
): Promise<PostCommandLog> => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('updatePost failed, no previous post with the same id: ' + post._id);
    }
    // This is a hack now to force upload to Swarm
    const updatedPost = {
        ...post,
        link: undefined,
    };
    const uploadedPost = await uploadPost(updatedPost, options.imageResizer, options.modelHelper);
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getPreviousPostCommandTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp,
        post: uploadedPost,
        type: 'update',
        previousEpoch,
        _epoch: undefined,
    };
    const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarmFeedApi);
    return {
        ...postCommandLog,
        commands: [uploadedPostCommand, ...postCommandLog.commands],
    };
};

// TODO
// export const removePost = async (
//     post: Post,
//     postCommandFeed: PostCommandLog,
//     swarmFeedApi: Swarm.FeedApi,
//     options: PostOptions = DefaultPostOptions,
// ) => {
//     const removedPost: Post = {
//         _id: post._id,
//         text: '',
//         images: [],
//         createdAt: post.createdAt,
//     };
//     const postCommand: PostCommand = {
//         version: CurrentPostCommandVersion,
//         post: removedPost,
//         type: 'remove',
//     };
//     const uploadedPostCommand =  await addPostCommandToFeed(postCommand, swarmFeedApi);
//     return {
//         ...postCommandFeed,
//         commands: [uploadedPostCommand, ...postCommandFeed.commands],
//     };
// };

const addPostCommandToFeed = async (postCommand: PostCommand, swarmFeedApi: Swarm.FeedApi): Promise<PostCommand> => {
    const data = serialize(postCommand);
    const feedTemplate = await swarmFeedApi.update(data);
    return {
        ...postCommand,
        _epoch: feedTemplate.epoch,
    };
};

const testIdentity = {
    privateKey: '0xe2c4b9cd9d0ea08fff1d797c756c1b0e8afbd7f151588f1f3a4d14149d93a5d7',
    publicKey: '0x047b441bb5656f69a721b466c087aa5087a31647f477919cf6f97e7583583db61fb0f555e154de4821c9b7e33f33eaf41b637d2ddfff1f8ccd10d330043fc667a6',
    address: '0xec3879077574f5d53c438e3de0627a4cbcf30512',
};

const testPostCommandFeed: PostCommandLog = {
    commands: [],
};

export const testSharePost = async (
    id: number = 1,
    postCommandLog: PostCommandLog = testPostCommandFeed
): Promise<PostCommandLog> => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    const post: Post = {
        _id: id,
        text: 'hello' + id,
        images: [],
        createdAt: Date.now(),
    };
    return await shareNewPost(post, postCommandLog, swarmFeedApi);
};

export const testSharePosts = async () => {
    const postCommandLogAfter1 = await testSharePost(1, testPostCommandFeed);
    const postCommandLogAfter2 = await testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = await testSharePost(3, postCommandLogAfter2);
};

export const testSharePostsWithUpdate = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);

    const postCommandLogAfter1 = await testSharePost(1, testPostCommandFeed);
    const post1 = postCommandLogAfter1.commands[0].post;
    const postCommandLogAfter2 = await testSharePost(2, postCommandLogAfter1);
    const postCommandLogAfter3 = await testSharePost(3, postCommandLogAfter2);
    const post1Update = {
        ...post1,
        text: 'Updated post1',
    };
    const postCommandLogAfter4 = await updatePost(post1Update, postCommandLogAfter3, swarmFeedApi);
};

export const testListAllPosts = async () => {
    const swarmFeedApi = Swarm.makeFeedApi(testIdentity);
    let postCommandJSON = await swarmFeedApi.download();
    while (true) {
        Debug.log('testListAllPosts', 'postCommandJSON', postCommandJSON);
        const postCommand = deserialize(postCommandJSON) as PostCommand;
        const previousEpoch = postCommand.previousEpoch;
        if (previousEpoch == null) {
            Debug.log('testListAllPosts', 'finished');
            break;
        }
        postCommandJSON = await swarmFeedApi.downloadPreviousVersion(previousEpoch);
    }
};

export const allTests = {
    testSharePost,
    testSharePosts,
    testSharePostsWithUpdate,
    testListAllPosts,
};
