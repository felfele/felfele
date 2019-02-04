import { NetInfo, ConnectionInfo, ConnectionType } from 'react-native';

type Listener = (x: boolean) => void;

const isConnectionInfo = (object: any): object is ConnectionInfo => {
    return 'type' in object;
};

// tslint:disable-next-line:class-name
class _NetworkStatus {
    public static getConnectionState(info: ConnectionInfo | ConnectionType): boolean {
        if (isConnectionInfo(info)) {
            if (info.type === 'none' || info.type === 'unknown') {
                return false;
            }
        }
        else {
            if (info === 'none' || info === 'unknown') {
                return false;
            }
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

    private onConnectionChange(connectionInfo: ConnectionInfo | ConnectionType) {
        this.connectionState = _NetworkStatus.getConnectionState(connectionInfo);
        this.listeners.map(listener => listener(this.connectionState != null && this.connectionState));
    }
}

export const NetworkStatus = new _NetworkStatus();
