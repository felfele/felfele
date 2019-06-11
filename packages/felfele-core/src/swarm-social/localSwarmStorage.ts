import {
    PostCommand,
    PostCommandLog,
    PostCommandLogStorage,
} from '../social/api';

// localSwarmStorage is a local storage that has the semantics of a Swarm storage
// therefore it can be used for testing
export const makeLocalSwarmStorage = (): PostCommandLogStorage => {
    let postCommandLog: PostCommandLog = {
        commands: [],
    };
    let time = 0;
    return {
        uploadPostCommand: async (postCommand: PostCommand) => {
            const updatedPostCommand = {
                ...postCommand,
                epoch: {
                    time: time++,
                    level: 0,
                },
            };
            postCommandLog = {
                commands: [updatedPostCommand, ...postCommandLog.commands],
            };
            return updatedPostCommand;
        },
        downloadPostCommandLog: async () => {
            return postCommandLog;
        },
    };
};
