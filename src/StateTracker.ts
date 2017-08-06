type Listener = (oldVersion: number, newVersion: number) => void;

class StateTracker {
    version = 0;
    listeners: Listener[] = [];

    listen(listener: Listener) {
        this.listeners.push(listener);
    }

    updateVersion(newVersion) {
        const oldVersion = this.version;
        this.version = newVersion;

        this.listeners.map((listener) => {
            listener(oldVersion, this.version);
        });
    }
}

export default new StateTracker();
