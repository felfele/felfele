import { PublicPost, Post } from '../models/Post';
import { Feed } from '../models/Feed';
import { ImageData } from '../models/ImageData';
import * as Swarm from '../swarm/Swarm';
import { Debug } from '../Debug';
import { LERNA_MAGIC } from '@felfele/felfele-core';

Debug.log(LERNA_MAGIC);
type PostCommandType = 'update' | 'remove';

export const PostCommandProtocolVersion = 1;

/**
 * This is used to identify a command, so this must be unique in a {@link PostCommandLog}
 */
interface PostCommandId {
    /**
     * The Lamport-timestamp of the command
     */
    timestamp: number;
    /**
     * Identifies the user or device where the command is originated
     */
    source: string;
}

const defaultPostCommandId = {
    timestamp: 0,
    source: '',
};

/**
 * Encapsulates the updates of posts
 */
export interface PostCommand {
    /**
     * Used for versioning
     */
    protocolVersion: number;

    /**
     * Unique identifier of the command
     */
    id: PostCommandId;
    /**
     * If the command updates or removes an existing post then this is set
     * to reference the previous command
     */
    parentId: PostCommandId;

    /**
     * Can be update or remove
     */
    type: PostCommandType;
    /**
     * The actual post content
     */
    post: Post;

    /**
     * If the command is stored on Swarm, this is set to the {@link Swarm.Epoch}
     * of the update
     */
    epoch?: Swarm.Epoch;
    /**
     * Points to the previous update that is stored on Swarm
     */
    previousEpoch?: Swarm.Epoch;
}

/**
 * This stores the {@link PostCommand}s ordered by the time the posts
 * will be displayed. The first item in the commands is the latest
 * update.
 *
 * With `assertPostCommandLogInvariants` you can check the validity of
 * the logs in the tests.
 */
export interface PostCommandLog {
    readonly commands: PostCommand[];
}

export const emptyPostCommandLog: PostCommandLog = {
    commands: [],
};

/**
 * This stores the latest posts similarly to an RSS/Atom feed.
 */
export interface RecentPostFeed extends Feed {
    posts: PublicPost[];
    authorImage: ImageData;
}

/**
 * This is a helper interface that can be used to store a feed locally
 */
export interface LocalFeed extends RecentPostFeed {
    postCommandLog: PostCommandLog;
    isSyncing: boolean;
    autoShare: boolean;
}

/**
 * This interface must be implemented by storages that intends to
 * store PostCommandLogs.
 */
export interface PostCommandLogStorage {
    /**
     * Upload a post update to the storage.
     *
     * @param postCommand contains the update to be uploaded
     *
     * @returns the updated PostCommand
     */
    uploadPostCommand: (postCommand: PostCommand) => Promise<PostCommand>;

    /**
     * Download a post command log
     *
     * @param since optional epoch that specifies the time of the last update
     * to be downloaded. If empty downloads the whole command log.
     *
     * @returns the downloaded PostCommandLog
     */
    downloadPostCommandLog: (since?: Swarm.Epoch) => Promise<PostCommandLog>;
}

/**
 * This interface must be implemented by storages that intends to
 * store RecentPostFeeds.
 */
export interface RecentPostFeedStorage {
    /**
     * Uploads (and updates) the RecentPostFeed
     *
     * @param postCommandLog contains all the updates that is used to calculate
     * the recent updates
     * @param recentPostFeed used as a template for creating the feed update
     *
     * @returns the updated RecentPostFeed
     */
    uploadRecentPostFeed: (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => Promise<RecentPostFeed>;

    /**
     * Downloades the RecentPostFeed
     *
     * @param timeout the maximum time to wait to download the feed, if exceeded an
     * exception is thrown
     *
     * @returns the downloaded RecentPostFeed
     */
    downloadRecentPostFeed: (timeout: number) => Promise<RecentPostFeed>;
}

/**
 * A storage must implement post command log storage and recent
 * feed storage as well.
 */
export type Storage = PostCommandLogStorage & RecentPostFeedStorage;

/**
 * The updates after a sync is returned in this interface
 */
export interface StorageSyncUpdate {
    /**
     * The updated and synced PostCommandLog
     */
    postCommandLog: PostCommandLog;
    /**
     * The updated RecentPostFeed
     */
    recentPostFeed: RecentPostFeed;
    /**
     * The updated posts
     */
    updatedPosts: Post[];
}

/**
 * This interface must be implemented by storages which supports syncing.
 */
export interface StorageSyncer {
    /**
     * Syncs the post command logs between the storage and the local command log.
     *
     * @param postCommandLog the local command log
     * @param recentPostFeed the local recent post feed
     *
     * @returns the updates after syncing
     */
    sync: (postCommandLog: PostCommandLog, recentPostFeed: RecentPostFeed) => Promise<StorageSyncUpdate>;
}

/**
 * Shares a new post and puts it in the command log
 *
 * @param post the post to be shared
 * @param source the unique identifier of a user/device
 * @param postCommandLog the post command log
 *
 * @returns the updated post command log
 */
export const shareNewPost = (
    post: Post,
    source: string,
    postCommandLog: PostCommandLog,
): PostCommandLog => {
    const parentId = getParentIdFromLog(post, postCommandLog);
    if (parentId.timestamp !== 0) {
        Debug.log('shareNewPost found a post with the same id: ' + post._id);
        return postCommandLog;
    }
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

/**
 * Updates an existing post.
 *
 * @param post the updated post, its _id must be already in the post command log
 * @param source the unique identifier of a user/device
 * @param postCommandLog the post command log
 *
 * @returns the updated post command log
 *
 * @remarks Throws an error if it cannot find the original post
 */
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

/**
 * Removes an existing post by marking it removed.
 *
 * @param post the updated post, its _id must be already in the post command log
 * @param source the unique identifier of a user/device
 * @param postCommandLog the post command log
 *
 * @returns the updated post command log
 *
 * @remarks Throws an error if it cannot find the original post
 */
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

/**
 * Tells if a PostCommand is already uploaded to the storage
 *
 * @param postCommand the post command
 *
 * @returns true if already uploaded, false otherwise
 */
export const isAlreadyUploaded = (postCommand: PostCommand): boolean => {
    return postCommand.epoch != null;
};

/**
 * Compares two post commands if they are equal.
 *
 * @param a one post command
 * @param b another post command
 *
 * @returns true if the provided post commands are equal, false otherwise
 *
 * @remarks This is a logical comparison from the perspective of the ordering
 * of the command log, so it is possible that two different post commands
 * objects are equal.
 */
export const arePostCommandIdsEqual = (a: PostCommandId, b: PostCommandId): boolean =>
    a.timestamp === b.timestamp && a.source === b.source;

/**
 * Returns the highest seen (Lamport) timestamp from a log
 *
 * @param postCommandLog the log
 *
 * @returns the highest seen timestamp or 0 if the log is empty
 */
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

/**
 * Returns the epoch of the previous (first) command from the log
 *
 * @param postCommandLog the log
 *
 * @returns the epoch or undefined if the log is empty
 */
export const getPreviousCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    if (postCommandLog.commands.length === 0) {
        return undefined;
    }
    return postCommandLog.commands[0].epoch;
};

/**
 * Finds the parent of a post from the log
 *
 * @param post the post
 * @param postCommandLog the log
 *
 * @returns the id of the parent or a default id if not found.
 *
 * @remarks The default id has 0 as time.
 */
export const getParentIdFromLog = (post: Post, postCommandLog: PostCommandLog): PostCommandId => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.post._id === post._id) {
            return postCommand.id;
        }
    }
    return defaultPostCommandId;
};

/**
 * Finds the latest epoch from the log.
 *
 * This can be used to tell the last time the log was synced with a storage.
 *
 * @param postCommandLog the log
 *
 * @returns the latest epoch or undefined if the log was never synced
 */
export const getLatestPostCommandEpochFromLog = (postCommandLog: PostCommandLog): Swarm.Epoch | undefined => {
    for (const postCommand of postCommandLog.commands) {
        if (postCommand.epoch != null) {
            return postCommand.epoch;
        }
    }
    return undefined;
};

/**
 * Finds the post command by an id
 *
 * @param postCommandLog the log
 * @param id the id of a command
 *
 * @returns the post command or undefined if not found
 */
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

/**
 * Compares epoch, can be used for sorting.
 *
 * @param a one epoch
 * @param b another epoch
 *
 * @returns 0 if the epoch are the same, -1 if a is earlier than b, 1 if
 * it's the other way
 */
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

/**
 * Returns the canonical ordering of a list of commands
 *
 * @param commands the list of commands
 *
 * @returns the canonical ordering of the commands
 *
 * @remarks It's possible that this function returns a list with
 * less elements than the original, because it also throws away
 * duplicates.
 */
export const sortAndFilterPostCommands = (commands: PostCommand[]): PostCommand[] => {
    const sortedCommands = [...commands].sort((a, b) =>
            // reversed time ordering
            timestampCompare(b, a) || sourceCompare(b, a) || epochCompare(b.epoch, a.epoch)
        )
        .filter((value, index, cmds) =>
            // filter out doubles
            index + 1 < cmds.length
            ? arePostCommandIdsEqual(value.id, cmds[index + 1].id) === false
            : true
        )
        .sort((a, b) => epochCompare(b.epoch, a.epoch))
        ;

    return sortedCommands;
};

/**
 * Returns the merged list of two command logs
 *
 * @param postCommandLogA one command log
 * @param postCommandLogB another command log
 *
 * @returns the canonical ordering of the merged commands
 */
export const mergePostCommandLogs = (postCommandLogA: PostCommandLog, postCommandLogB: PostCommandLog): PostCommandLog => {
    const commands = postCommandLogA.commands.concat(postCommandLogB.commands);
    const sortedCommands = sortAndFilterPostCommands(commands);
    return {
        commands: sortedCommands,
    };
};

/**
 * Returns the subset of a command log with items that are not yet synced to
 * storage.
 *
 * @param postCommandLog the command log
 *
 * @returns a command log with the unsynced commands
 */
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

/**
 * Returns the latest posts from the command log
 *
 * @param postCommandLog the command log
 * @param count optional parameter to limit the maximum number of posts,
 *  if omitted it returns all posts
 *
 * @returns a list of posts
 */
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

/**
 * Returns only update commands since a certain time
 *
 * @param postCommandLog the command log
 * @param epoch an optinal parameter to specify the time since the last update
 * if omitted, the function returns all updates
 *
 * @returns a command log with only updates
 */
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
