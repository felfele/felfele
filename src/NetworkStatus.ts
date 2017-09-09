import { NetInfo } from 'react-native';

type Listener = (boolean) => void;

class _NetworkStatus {
    connectionState: boolean | null = null;
    listeners: Listener[] = [];

    constructor() {
        NetInfo.addEventListener('connectionChange', (connectionInfo) => this.onConnectionChange(connectionInfo));
        // (<any>NetInfo).getConnectionInfo().then((connectionInfo) => this.onConnectionChange(connectionInfo));
    }

    isConnected(): boolean {
        if (this.connectionState == null) {
            return false;
        }
        return this.connectionState;
    }

    static getConnectionState(connectionInfo): boolean {
        if (connectionInfo.type == 'none' || connectionInfo.type == 'unknown') {
            return false;
        }
        return true;
    }

    onConnectionChange(connectionInfo) {
        this.connectionState = _NetworkStatus.getConnectionState(connectionInfo);
        this.listeners.map(listener => listener(this.connectionState));
    }

    addConnectionStateChangeListener(listener: (result: boolean) => void) {
        this.listeners.push(listener);
    }
}

export const NetworkStatus = new _NetworkStatus();
