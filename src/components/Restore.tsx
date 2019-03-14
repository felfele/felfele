import * as React from 'react';
import { View, StyleSheet, Clipboard, Alert, SafeAreaView } from 'react-native';
import { NavigationHeader } from './NavigationHeader';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';
import { Colors, DefaultNavigationBarHeight } from '../styles';
import { Button } from './Button';
import { isValidBackup, restoreBackupToString } from '../BackupRestore';
import { stringToHex } from '../conversion';
import { getAppStateFromSerialized } from '../reducers';

export interface StateProps {
    navigation: any;
}

export interface DispatchProps {
    onRestoreData: (data: string, secretHex: string) => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
    clipboardText: string;
    secretText: string;
    canRestore: boolean;
}

export class Restore extends React.PureComponent<Props, State> {
    public state = {
        clipboardText: '',
        secretText: '',
        canRestore: false,
    };

    public componentWillMount = () => {
        Clipboard.getString().then(value => {
            Debug.log('Restore clipboard', value);
            this.setState({clipboardText: value});
        });
    }

    public render = () => (
        <SafeAreaView style={styles.mainContainer}>
            <NavigationHeader
                title='Restore'
                onPressLeftButton={() => this.props.navigation.goBack(null)}
            />
            <View style={styles.secretContainer}>
                <SimpleTextInput
                    style={styles.secretTextInput}
                    multiline={true}
                    numberOfLines={4}
                    placeholder='Enter your backup password here'
                    autoCapitalize='none'
                    autoCorrect={false}
                    onChangeText={async (text) => this.onChangeSecret(text)}
                />
                <Button enabled={this.state.canRestore} style={styles.restoreButton} text='Restore' onPress={() => this.onRestoreData()} />
            </View>
            <SimpleTextInput
                style={styles.backupTextInput}
                editable={false}
                value={this.state.clipboardText}
                defaultValue='Loading backup...'
                multiline={true}
            />
        </SafeAreaView>
    )

    private onChangeSecret = async (text: string) => {
        try {
            const secretHex = stringToHex(text);
            const serializedAppState = await restoreBackupToString(this.state.clipboardText, secretHex);
            const appState = await getAppStateFromSerialized(serializedAppState);
            Debug.log('Restore.onChangeSecret: success');
            this.setState({
                secretText: text,
                canRestore: true,
            });
        } catch (e) {
            Debug.log('Restore.onChangeSecret: failed', e);
            this.setState({
                secretText: text,
                canRestore: false,
            });
        }
    }

    private onRestoreData = () => {
        const isValid = isValidBackup(this.state.clipboardText);
        if (!isValid) {
            Alert.alert('Invalid backup!');
            return;
        }

        const data = this.state.clipboardText;
        const secretHex = stringToHex(this.state.secretText);
        this.props.onRestoreData(data, secretHex);
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
