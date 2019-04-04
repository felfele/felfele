import * as React from 'react';
import { View, StyleSheet, Clipboard, Alert, SafeAreaView } from 'react-native';
import { NavigationHeader } from './NavigationHeader';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';
import { Colors, DefaultNavigationBarHeight } from '../styles';
import { Button } from './Button';
import {
    isValidBackupLinkData,
    downloadBackupFromSwarm,
} from '../helpers/backup';
import { getAppStateFromSerialized } from '../reducers';
import { TypedNavigation } from '../helpers/navigation';
import * as Swarm from '../swarm/Swarm';
import { AppState } from '../reducers/AppState';
import { HexString } from '../helpers/opaqueTypes';

export interface StateProps {
    navigation: TypedNavigation;
    swarmGatewayAddress: string;
}

export interface DispatchProps {
    onRestoreData: (appState: AppState) => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
    backupPassword: string;
    backupLinkData: HexString;
    backupInfo: string;
    appState: AppState | undefined;
}

export class Restore extends React.PureComponent<Props, State> {
    public state: State = {
        backupPassword: '',
        backupLinkData: '' as HexString,
        backupInfo: '',
        appState: undefined,
    };

    public componentWillMount = () => {
        Clipboard.getString().then(value => {
            Debug.log('Restore clipboard', value);
            if (isValidBackupLinkData(value)) {
                this.setState({
                    backupLinkData: value as HexString,
                }, () => this.onChangePassword(''));
            }
        });
    }

    public render = () => (
        <SafeAreaView style={styles.mainContainer}>
            <NavigationHeader
                title='Restore'
                navigation={this.props.navigation}
            />
            <View style={styles.secretContainer}>
                <SimpleTextInput
                    style={styles.secretTextInput}
                    multiline={true}
                    numberOfLines={4}
                    placeholder='Enter your backup password here'
                    autoCapitalize='none'
                    autoCorrect={false}
                    defaultValue={this.state.backupPassword}
                    onChangeText={async (text) => this.onChangePassword(text)}
                />
                <Button
                    enabled={this.state.appState != null}
                    style={styles.restoreButton}
                    text='Restore'
                    onPress={() => this.onRestoreData()}
                />
            </View>
            <SimpleTextInput
                style={styles.backupTextInput}
                editable={false}
                placeholder='Loading backup...'
                defaultValue={this.state.backupInfo}
                multiline={true}
            />
        </SafeAreaView>
    )

    private onChangePassword = async (password: string) => {
        try {
            const bzz = Swarm.makeBzzApi(this.props.swarmGatewayAddress);
            const serializedAppState = await downloadBackupFromSwarm(bzz, this.state.backupLinkData, password);
            const appState = await getAppStateFromSerialized(serializedAppState);
            Debug.log('Restore.onChangePassword', 'success');

            const backupInfo = 'App state downloaded and decrypted';

            this.setState({
                appState,
                backupInfo,
            });
        } catch (e) {
            Debug.log('Restore.onChangePassword', 'failed', e);
            this.setState({
                appState: undefined,
            });
        }
    }

    private onRestoreData = async () => {
        if (this.state.appState != null) {
            this.props.onRestoreData(this.state.appState!);
        }
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        height: '100%',
        flexDirection: 'column',
    },
    backupTextInput: {
        fontSize: 10,
        flex: 1,
        padding: 3,
        margin: 10,
        color: Colors.GRAY,
        backgroundColor: Colors.WHITE,
        marginBottom: DefaultNavigationBarHeight + 10,
    },
    restoreButton: {
        paddingVertical: 20,
        paddingLeft: 20,
        width: 100,
    },
    secretContainer: {
        flexDirection: 'row',
    },
    secretTextInput: {
        fontSize: 12,
        flex: 1,
        padding: 3,
        margin: 10,
        borderRadius: 2,
        height: 60,
        color: Colors.DARK_GRAY,
        backgroundColor: Colors.WHITE,
    },
});
