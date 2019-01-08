import * as React from 'react';
import { View, StyleSheet, Clipboard, Alert, ShareContent, ShareOptions, Share } from 'react-native';
import { NavigationHeader } from './NavigationHeader';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';
import { Colors, DefaultNavigationBarHeight } from '../styles';
import { Button } from './Button';
import { isValidBackup, stripHeaderAndFooter, createBackup } from '../BackupRestore';
import { DateUtils } from '../DateUtils';
import { AppState } from '../reducers';
import { stringToHex } from '../Swarm';

export interface StateProps {
    navigation: any;
    appState: AppState;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

export interface State {
    backupText: string;
    secretText: string;
}

export class Backup extends React.PureComponent<Props, State> {
    public state = {
        backupText: '',
        secretText: '',
    };

    public render = () => (
        <View style={styles.mainContainer}>
            <NavigationHeader
                title='Backup'
                onPressLeftButton={() => this.props.navigation.goBack(null)}
            />
            <View style={styles.secretContainer}>
                <SimpleTextInput
                    style={styles.secretTextInput}
                    multiline={true}
                    numberOfLines={4}
                    placeholder='Enter your secret here'
                    autoCapitalize='none'
                    autoCorrect={false}
                    onChangeText={async (text) => await this.setSecretText(text)}
                />
                <Button style={styles.backupButton} text='Backup' onPress={async () => await this.onBackupData()} />
            </View>
            <SimpleTextInput
                style={styles.backupTextInput}
                editable={false}
                value={this.state.backupText}
                placeholder='Loading backup...'
                multiline={true}
            />
        </View>
    )

    private setSecretText = async (text: string) => {
        const secretHex = stringToHex(this.state.secretText);
        const backupText = await createBackup(this.props.appState, secretHex);

        this.setState({
            secretText: text,
            backupText,
        });
    }

    private showShareDialog = async (message: string) => {
        const title = 'Felfele backup ' + DateUtils.timestampToDateString(Date.now(), true);
        const content: ShareContent = {
            title,
            message,
        };
        const options: ShareOptions = {
        };
        await Share.share(content, options);
    }

    private onBackupData = async () => {
        try {
            const secretHex = stringToHex(this.state.secretText);
            const emailBody = await createBackup(this.props.appState, secretHex);
            Debug.log('sendBackup body', emailBody);

            this.showShareDialog(emailBody);
        } catch (e) {
            Debug.log('sendBackup error', e);
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
    backupButton: {
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
