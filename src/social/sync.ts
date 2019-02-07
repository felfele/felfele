import {
    PostCommand,
    PostCommandLog,
    PostCommandLogStorage,
    getUnsyncedPostCommandLog,
    getLatestPostCommandEpochFromLog,
    epochCompare,
    mergePostCommandLogs,
} from './api';
import { Debug } from '../Debug';

export const uploadUnsyncedPostCommandsToStorage = async (postCommandLog: PostCommandLog, storage: PostCommandLogStorage): Promise<PostCommandLog> => {
    const unsyncedCommandLog = getUnsyncedPostCommandLog(postCommandLog);
    const syncedCommands = postCommandLog.commands.slice(unsyncedCommandLog.commands.length);
    const reversedUnsyncedCommands = [...unsyncedCommandLog.commands].reverse();

    const previousSyncedEpoch = getLatestPostCommandEpochFromLog({commands: syncedCommands});

    let previousEpoch = previousSyncedEpoch;
    const uploadedCommands: PostCommand[] = [];
    for (const postCommand of reversedUnsyncedCommands) {
        const postCommandWithPreviousEpoch = {
            ...postCommand,
            previousEpoch,
        };

        const uploadedCommand = await storage.uploadPostCommand(postCommandWithPreviousEpoch);

        uploadedCommands.push(uploadedCommand);

        previousEpoch = uploadedCommand.epoch;
    }

    return {
        commands: uploadedCommands.reverse().concat(syncedCommands),
    };
};

export const syncPostCommandLogWithStorage = async (postCommandLog: PostCommandLog, storage: PostCommandLogStorage): Promise<PostCommandLog> => {
    const latestEpoch = getLatestPostCommandEpochFromLog(postCommandLog);

    const storagePostCommandLog = await storage.fetchPostCommandLog();
    const storageLatestEpoch = getLatestPostCommandEpochFromLog(storagePostCommandLog);

    Debug.log('syncPostCommandLogWithStorage', latestEpoch, storageLatestEpoch);
    if (epochCompare(latestEpoch, storageLatestEpoch) === 0) {
        return postCommandLog;
    }

    const mergedPostCommandLog = mergePostCommandLogs(postCommandLog, storagePostCommandLog);
    Debug.log('syncPostCommandLogWithStorage', 'mergedPostCommandLog', mergedPostCommandLog);

    const uploadedPostCommandLog = await uploadUnsyncedPostCommandsToStorage(mergedPostCommandLog, storage);

    return uploadedPostCommandLog;
};
