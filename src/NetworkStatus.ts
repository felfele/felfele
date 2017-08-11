import { NetInfo } from 'react-native';

class _NetworkStatus {
    connectionState: boolean | null = null;
    connectionType: string | null = null;

    constructor() {
        NetInfo.isConnected.addEventListener('change', (isConnected) => this.onConnectionStateChange(isConnected));
        NetInfo.addEventListener('change', (result) => this.onConnectionTypeChange(result));
        NetInfo.isConnected.fetch().then(value => this.connectionState = value);
    }

    isConnected(): boolean {
        if (this.connectionState == null) {
            return true;
        }
        return this.connectionState;
    }

    onConnectionStateChange(isConnected: boolean) {
        this.connectionState = isConnected;
    }

    addConnectionStateChangeListener(listener: (result: boolean) => void) {
        NetInfo.isConnected.addEventListener('change', listener);
    }

    async getConnectionType(): Promise<string> {
        if (this.connectionType == null) {
            this.connectionType = await NetInfo.fetch();
        }
        return this.connectionType;
    }

    onConnectionTypeChange(result) {
        this.connectionType = '' + result;
    }
}

export const NetworkStatus = new _NetworkStatus();
