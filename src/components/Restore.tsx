import * as React from 'react';
import { View, StyleSheet, Clipboard } from 'react-native';
import { NavigationHeader } from './NavigationHeader';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';
import { Colors, ComponentColors, DefaultNavigationBarHeight, defaultMediumFont } from '../styles';
import {
    isValidBackupLinkData,
    downloadBackupFromSwarm,
} from '../helpers/backup';
import { getAppStateFromSerialized } from '../reducers';
import { TypedNavigation } from '../helpers/navigation';
import * as Swarm from '../swarm/Swarm';
import { AppState } from '../reducers/AppState';
import { HexString } from '../helpers/opaqueTypes';
import { TouchableView } from './TouchableView';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MediumText } from '../ui/misc/text';
import { FragmentSafeAreaViewWithoutTabBar } from '../ui/misc/FragmentSafeAreaView';
import * as AreYouSureDialog from './AreYouSureDialog';
import { Utils } from '../Utils';
import { restartApp } from '../helpers/restart';

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

const RestoreButton = (props: {
    onPress: () => void;
    enabled: boolean;
}) => {
    const onPress = props.enabled
        ? props.onPress
        : undefined
    ;
    const color = props.enabled
        ? Colors.BRAND_PURPLE
        : Colors.LIGHT_GRAY
    ;
    return (
        <TouchableView onPress={onPress} style={styles.buttonContainer}>
            <View style={styles.buttonIcon}>
                <Icon name='cloud-download' color={color} size={24} />
            </View>
            <MediumText style={[styles.buttonLabel, {color}]}>Restore</MediumText>
        </TouchableView>
    );
};

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
        <FragmentSafeAreaViewWithoutTabBar>
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
            </View>
            <RestoreButton
                enabled={this.state.appState != null}
                onPress={() => this.onRestoreData()}
            />
            <SimpleTextInput
                style={styles.backupTextInput}
                editable={false}
                placeholder='Loading backup...'
                defaultValue={this.state.backupInfo}
                multiline={true}
            />
        </FragmentSafeAreaViewWithoutTabBar>
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
        const confirmUnfollow = await AreYouSureDialog.show(
            'Are you sure you want to restore data?',
            'This will delete all your data and there is no undo!'
        );
        if (confirmUnfollow && this.state.appState != null) {
            this.props.onRestoreData(this.state.appState!);
            await Utils.waitMillisec(3 * 1000);
            restartApp();
        }
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        height: '100%',
        flexDirection: 'column',
        backgroundColor: ComponentColors.HEADER_COLOR,
    },
    backupTextInput: {
        fontSize: 10,
        flex: 1,
        padding: 3,
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
        width: '100%',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 14,
        color: Colors.DARK_GRAY,
        fontSize: 14,
        fontFamily: defaultMediumFont,
        marginTop: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
        margin: 10,
        height: 44,
    },
    buttonIcon: {
        alignItems: 'center',
        paddingRight: 6,
    },
    buttonLabel: {
        fontSize: 12,
        color: Colors.BRAND_PURPLE,
    },
});
