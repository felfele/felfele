import { PublicPost, Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { ImageData } from '../models/ImageData';
import * as Swarm from '../swarm/Swarm';

type PostCommandType = 'update' | 'remove';

export const PostCommandProtocolVersion = 1;

interface PostCommandId {
    timestamp: number;
    source: string;
}

const defaultPostCommandId = {
    timestamp: 0,
    source: '',
};

export interface PostCommand {
    protocolVersion: number;

    id: PostCommandId;
    parentId: PostCommandId;

    type: PostCommandType;
    post: Post;

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

export const emptyPostCommandLog: PostCommandLog = {
    commands: [],
};

export interface RecentPostFeed extends Feed {
    posts: PublicPost[];
    authorImage: ImageData;
}

export interface LocalFeed extends RecentPostFeed {
    postCommandLog: PostCommandLog;
    isSyncing: boolean;
}

export interface PostCommandLogStorage {
    uploadPostCommand: (postCommand: PostCommand) => Promise<PostCommand>;
    downloadPostCommandLog: (until?: Swarm.Epoch) => Promise<PostCommandLog>;
}

export interface RecentPostFeedStorage {
    uploadRecentPostFeed: (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => Promise<RecentPostFeed>;
    downloadRecentPostFeed: (url: string, timeout: number) => Promise<RecentPostFeed>;
}

export interface StorageSyncUpdate {
    postCommandLog: PostCommandLog;
    recentPostFeed: RecentPostFeed;
    updatedPosts: Post[];
}

export type Storage = PostCommandLogStorage & RecentPostFeedStorage;

export interface StorageSyncer {
    sync: (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => Promise<StorageSyncUpdate>;
}

export const isAlreadyUploaded = (postCommand: PostCommand): boolean => {
    return postCommand.epoch != null;
};

export const arePostCommandIdsEqual = (a: PostCommandId, b: PostCommandId): boolean =>
    a.timestamp === b.timestamp && a.source === b.source;

export const getHighestSeenTimestampFromLog = (postCommandLog: PostCommandLog): number => {
    if (postCommandLog.commands.length === 0) {
        return 0;
    }
    if (postCommandLog.commands[0].epoch != null) {
        return postCommandLog.commands[0].id.timestamp;
    }
    const highestUnsyncedTimestamp = postCommandLog.commands[0].id.timestamp;
    if (highestUnsyncedTimestamp === postCommandLog.commands.length) {
        // never synced
        return highestUnsyncedTimestamp;
    }
    for (const command of postCommandLog.commands) {
        if (command.epoch != null) {
            if (command.id.timestamp > highestUnsyncedTimestamp) {
                return command.id.timestamp;
            } else {
                break;
            }
        }
    }
    return highestUnsyncedTimestamp;
};

export const getPreviousCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    if (postCommandLog.commands.length === 0) {
        return undefined;
    }
    return postCommandLog.commands[0].epoch;
};

export const getParentIdFromLog = (post: Post, postCommandLog: PostCommandLog): PostCommandId => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.post._id === post._id) {
            return postCommand.id;
        }
    }
    return defaultPostCommandId;
};

export const getLatestPostCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.epoch != null) {
            return postCommand.epoch;
        }
    }
    return undefined;
};

export const getPostCommandFromLogById = (postCommandLog: PostCommandLog, id: PostCommandId): PostCommand | undefined => {
    for (const postCommand of postCommandLog.commands) {
        if (arePostCommandIdsEqual(postCommand.id, id)) {
            return postCommand;
        }
    }
    return undefined;
};

const timestampCompare = (a: PostCommand, b: PostCommand) => {
    return a.id.timestamp - b.id.timestamp;
};

const sourceCompare = (a: PostCommand, b: PostCommand) => {
    return a.id.source.localeCompare(b.id.source);
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
            epochCompare(b.epoch, a.epoch) || timestampCompare(b, a) || sourceCompare(b, a)
        )
        .filter((value, index, cmds) =>
            // filter out doubles
            index + 1 < cmds.length
            ? arePostCommandIdsEqual(value.id, cmds[index + 1].id) === false
            : true
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
        id: {
            timestamp,
            source,
        },
        parentId: {
            timestamp: 0,
            source: '',
        },
        post,
        type: 'update',
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
    const parentId = getParentIdFromLog(post, postCommandLog);
    if (parentId.timestamp === 0) {
        throw new Error('updatePost failed, no previous post with the same id: ' + post._id);
    }
    const previousEpoch = getPreviousCommandEpochFromLog(postCommandLog);
    const timestamp = getHighestSeenTimestampFromLog(postCommandLog) + 1;
    const postCommand: PostCommand = {
        protocolVersion: PostCommandProtocolVersion,
        id: {
            timestamp,
            source,
        },
        parentId,
        post: post,
        type: 'update',
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
    const parentId = getParentIdFromLog(post, postCommandLog);
    if (parentId.timestamp === 0) {
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
        id: {
            timestamp,
            source,
        },
        parentId,
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
    const skipPostCommandSet = new Set<PostCommandId>();
    const updatePostCommands = postCommandLog.commands.filter(postCommand => {
        if (postCommand.parentId.timestamp !== 0) {
            skipPostCommandSet.add(postCommand.parentId);
        }
        if (postCommand.type === 'remove') {
            return false;
        }
        if (skipPostCommandSet.has(postCommand.id)) {
            return false;
        }
        return true;
    });
    return updatePostCommands.slice(0, count);
};

export const getPostCommandUpdatesSinceEpoch = (postCommandLog: PostCommandLog, epoch?: Swarm.Epoch): PostCommandLog => {
    const postCommandUpdates: PostCommand[] = [];
    for (const command of postCommandLog.commands) {
        if (command.epoch == null) {
            continue;
        }

        if (epoch == null || epochCompare(epoch, command.epoch) < 0) {
            postCommandUpdates.push(command);
            continue;
        }
    }
    return {
        ...postCommandLog,
        commands: postCommandUpdates,
    };
};
