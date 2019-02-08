import {
    PostCommand,
    PostCommandLog,
    PostCommandLogStorage,
} from '../social/api';

// localSwarmStorage is a local storage that has the semantics of a Swarm storage
// therefore it can be used for testing
class LocalSwarmStorage implements PostCommandLogStorage {
    private postCommandLog: PostCommandLog = {
        commands: [],
    };
    private time = 0;

    public uploadPostCommand = async (postCommand: PostCommand) => {
        const updatedPostCommand = {
            ...postCommand,
            epoch: {
                time: this.time++,
                level: 0,
            },
        };
        this.postCommandLog = {
            commands: [updatedPostCommand, ...this.postCommandLog.commands],
        };
        return updatedPostCommand;
    }

    public downloadPostCommandLog = async () => {
        return this.postCommandLog;
    }
}

export const makeLocalSwarmStorage = () => new LocalSwarmStorage();
