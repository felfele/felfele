import { NetInfo } from 'react-native';

class _NetworkStatus {
    connectionState: boolean | null = null;
    connectionType: string | null = null;

    constructor() {
        NetInfo.isConnected.addEventListener('change', this.onConnectionStateChange);
        NetInfo.addEventListener('change', this.onConnectionTypeChange);
    }

    async isConnected(): Promise<boolean> {
        if (this.connectionState == null) {
            this.connectionState = await NetInfo.isConnected.fetch();
        }
        return this.connectionState;
    }

    onConnectionStateChange(isConnected: boolean) {
        this.connectionState = isConnected;
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