import { NetInfo } from 'react-native';

type Listener = (x: boolean) => void;

// tslint:disable-next-line:class-name
class _NetworkStatus {
    public static getConnectionState(connectionInfo): boolean {
        if (connectionInfo.type === 'none' || connectionInfo.type === 'unknown') {
            return false;
        }
        return true;
    }

    private connectionState: boolean | null = null;
    private listeners: Listener[] = [];

    constructor() {
        NetInfo.addEventListener('connectionChange', (connectionInfo) => this.onConnectionChange(connectionInfo));
    }

    public isConnected(): boolean {
        if (this.connectionState == null) {
            return false;
        }
        return this.connectionState;
    }

    public addConnectionStateChangeListener(listener: (result: boolean) => void) {
        this.listeners.push(listener);
    }

    private onConnectionChange(connectionInfo) {
        this.connectionState = _NetworkStatus.getConnectionState(connectionInfo);
        this.listeners.map(listener => listener(this.connectionState != null && this.connectionState));
    }
}

export const NetworkStatus = new _NetworkStatus();
