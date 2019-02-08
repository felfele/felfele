import { PublicPost, Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { ImageData } from '../models/ImageData';
import * as Swarm from '../swarm/Swarm';

type PostCommandType = 'update' | 'remove';

export const PostCommandProtocolVersion = 1;

export interface PostCommand {
    protocolVersion: number;

    timestamp: number;
    parentTimestamp: number;

    type: PostCommandType;
    post: Post;
    source: string;

    epoch?: Swarm.Epoch;
    previousEpoch?: Swarm.Epoch;
}

export interface PostCommandLog {
    /*
     * These assumptions must held in order to this works correctly:
     *
     * - The posts are ordered by epoch in the array, when there is no epoch
     *   the posts are ordered by timestamp
     *
     * With `assertPostCommandLogInvariants` you can check the validity of
     * the logs in the tests.
     *
     */
    readonly commands: PostCommand[];
}

export interface RecentPostFeed extends Feed {
    posts: PublicPost[];
    authorImage: ImageData;
}

export interface PostCommandLogStorage {
    uploadPostCommand: (postCommand: PostCommand) => Promise<PostCommand>;
    downloadPostCommandLog: () => Promise<PostCommandLog>;
}

export interface RecentPostFeedStorage {
    uploadRecentPostFeed: (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => Promise<RecentPostFeed>;
    downloadRecentPostFeed: (url: string, timeout: number) => Promise<RecentPostFeed>;
}

export interface UpdatedStorage {
    postCommandLog: PostCommandLog;
    recentPostFeed: RecentPostFeed;
}

export type Storage = PostCommandLogStorage & RecentPostFeedStorage;

export interface StorageSyncer extends PostCommandLogStorage, RecentPostFeedStorage {
    sync: (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => Promise<UpdatedStorage>;
}

export const arePostCommandsEqual = (a: PostCommand, b: PostCommand): boolean =>
    a.timestamp === b.timestamp && a.source === b.source;

export const getHighestSeenTimestampFromLog = (postCommandLog: PostCommandLog): number => {
    if (postCommandLog.commands.length === 0) {
        return 0;
    }
    return postCommandLog.commands[0].timestamp;
};

export const getPreviousCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    if (postCommandLog.commands.length === 0) {
        return undefined;
    }
    return postCommandLog.commands[0].epoch;
};

export const getParentUpdateTimestampFromLog = (post: Post, postCommandLog: PostCommandLog): number => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.post._id === post._id) {
            return postCommand.timestamp;
        }
    }
    return 0;
};

export const getLatestPostCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.epoch != null) {
            return postCommand.epoch;
        }
    }
    return undefined;
};

const getPostCommandFromLogByTimestamp = (postCommandLog: PostCommandLog, timestamp: number): PostCommand | undefined => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.timestamp === timestamp) {
            return postCommand;
        }
    }
    return undefined;
};

const timestampCompare = (a: PostCommand, b: PostCommand) => {
    return a.timestamp - b.timestamp;
};

const sourceCompare = (a: PostCommand, b: PostCommand) => {
    return a.source.localeCompare(b.source);
};

export const epochCompare = (a?: Swarm.Epoch, b?: Swarm.Epoch): number => {
    if (a == null && b == null) {
        return 0;
    }
    if (a == null) {
        return 1;
    }
    if (b == null) {
        return -1;
    }
    const timeDiff = a.time - b.time;
    if (timeDiff !== 0) {
        return timeDiff;
    }
    return a.level - b.level;
};

export const sortAndFilterPostCommands = (commands: PostCommand[]): PostCommand[] => {
    const sortedCommands = [...commands].sort((a, b) =>
            // reversed time ordering
            epochCompare(b.epoch, a.epoch) || timestampCompare(b, a)
        )
        .filter((value, index, cmds) =>
            // filter out doubles
            index === 0
            ? true
            : arePostCommandsEqual(value, cmds[index - 1]) === false
        );

    return sortedCommands;
};

export const mergePostCommandLogs = (postCommandLogA: PostCommandLog, postCommandLogB: PostCommandLog): PostCommandLog => {
    const commands = postCommandLogA.commands.concat(postCommandLogB.commands);
    const sortedCommands = sortAndFilterPostCommands(commands);
    return {
        commands: sortedCommands,
    };
};

export const shareNewPost = (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
): PostCommandLog => {
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getHighestSeenTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp: 0,
        post,
        type: 'update',
        source,
        previousEpoch,
        epoch: undefined,
    };
    return {
        ...postCommandLog,
        commands: [postCommand, ...postCommandLog.commands],
    };
};

export const updatePost = (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
): PostCommandLog => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('updatePost failed, no previous post with the same id: ' + post._id);
    }
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getHighestSeenTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        timestamp,
        parentTimestamp,
        post: post,
        type: 'update',
        source,
        previousEpoch,
        epoch: undefined,
    };
    return {
        ...postCommandLog,
        commands: [postCommand, ...postCommandLog.commands],
    };
};

export const removePost = (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
) => {
    const parentTimestamp = getParentUpdateTimestampFromLog(post, postCommandLog);
    if (parentTimestamp === 0) {
        throw new Error('removePost failed, no previous post with the same id: ' + post._id);
    }
    const timestamp = getHighestSeenTimestampFromLog(postCommandLog) + 1;
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);

    const removedPost: Post = {
        _id: post._id,
        text: '',
        images: [],
        createdAt: post.createdAt,
    };
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        post: removedPost,
        type: 'remove',
        source,
        timestamp,
        parentTimestamp,
        previousEpoch,
    };
    return {
        ...postCommandLog,
        commands: [postCommand, ...postCommandLog.commands],
    };
};

export const getUnsyncedPostCommandLog = (postCommandLog: PostCommandLog): PostCommandLog => {
    const unsyncedCommands: PostCommand[] = [];
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.epoch != null) {
            return {
                ...postCommandLog,
                commands: unsyncedCommands,
            };
        }
        unsyncedCommands.push(postCommand);
    }
    return {
        ...postCommandLog,
        commands: unsyncedCommands,
    };
};

export const getLatestPostsFromLog = (postCommandLog: PostCommandLog, count: number | undefined = undefined): Post[] => {
    const updatePostCommands = getLatestUpdatePostCommandsFromLog(postCommandLog, count);
    const updatedPosts = updatePostCommands.map(postCommand => postCommand.post);
    return updatedPosts;
};

const getLatestUpdatePostCommandsFromLog = (postCommandLog: PostCommandLog, count: number | undefined = undefined): PostCommand[] => {
    const skipPostCommandSet = new Set<number>();
    const updatePostCommands = postCommandLog.commands.filter(postCommand => {
        if (postCommand.parentTimestamp !== 0) {
            skipPostCommandSet.add(postCommand.parentTimestamp);
        }
        if (postCommand.type === 'remove') {
            return false;
        }
        if (skipPostCommandSet.has(postCommand.timestamp)) {
            return false;
        }
        return true;
    });
    return updatePostCommands.slice(0, count);
};
