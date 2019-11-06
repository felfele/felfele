import * as React from 'react';
import {
    View,
    StyleSheet,
    Clipboard,
    ShareContent,
    ShareOptions,
    Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { NavigationHeader } from './NavigationHeader';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';
import { Colors, ComponentColors, DefaultNavigationBarHeight, defaultMediumFont } from '../styles';
import {
    backupToSwarm,
    encryptBackupLinkData,
    generateBackupRandomSecret,
} from '../helpers/backup';
import { DateUtils } from '../DateUtils';
import { getSerializedAppState } from '../store';
import { AppState } from '../reducers/AppState';
import { TypedNavigation } from '../helpers/navigation';
import * as Swarm from '../swarm/Swarm';
import { HexString } from '../helpers/opaqueTypes';
import { FragmentSafeAreaViewWithoutTabBar } from '../ui/misc/FragmentSafeAreaView';
import { TouchableView } from './TouchableView';
import { MediumText } from '../ui/misc/text';

export interface StateProps {
    navigation: TypedNavigation;
    appState: AppState;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

export interface State {
    backupPassword: string;
    randomSecret: HexString;
    contentHash: HexString;
    backupData: HexString;
    serializedAppState?: string;
}

const BackupButton = (props: {
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
                <Icon name='cloud-upload' color={color} size={24} />
            </View>
            <MediumText style={[styles.buttonLabel, {color}]}>Backup</MediumText>
        </TouchableView>
    );
};

export class Backup extends React.PureComponent<Props, State> {
    public state: State = {
        backupPassword: '',
        randomSecret: '' as HexString,
        contentHash: '' as HexString,
        backupData: '' as HexString,
        serializedAppState: undefined,
    };

    public componentDidMount = async () => {
        const randomSecret = await generateBackupRandomSecret();

        this.setState({
            randomSecret,
        });
    }

    public render = () => (
        <FragmentSafeAreaViewWithoutTabBar>
            <NavigationHeader
                title='Backup'
                navigation={this.props.navigation}
            />
            <View style={styles.secretContainer}>
                <SimpleTextInput
                    style={styles.secretTextInput}
                    multiline={true}
                    numberOfLines={1}
                    placeholder='Enter your backup password here'
                    autoCapitalize='none'
                    autoCorrect={false}
                    defaultValue={this.state.backupPassword}
                    onChangeText={async (text) => await this.setBackupPassword(text)}
                />
            </View>
            <BackupButton
                onPress={async () => await this.onBackupData()}
                enabled={this.state.contentHash === ''}
            />
            <SimpleTextInput
                style={styles.backupTextInput}
                editable={false}
                defaultValue={this.getBackupText()}
                placeholder='Saving backup...'
                multiline={true}
            />
        </FragmentSafeAreaViewWithoutTabBar>
    )

    private completeSetState = <K extends keyof State>(state: Pick<State, K>): Promise<void> => {
        return new Promise((resolve, reject) => {
            this.setState(state, () => resolve());
        });
    }

    private setBackupPassword = async (text: string) => {
        await this.completeSetState({
            backupPassword: text,
        });
    }

    private showShareDialog = async (backupData: HexString) => {
        Debug.log('Backup.showShareDialog', 'backupLink', backupData);
        const title = 'Felfele backup ' + DateUtils.timestampToDateString(Date.now(), true);
        const content: ShareContent = {
            title,
            message: backupData,
        };
        const options: ShareOptions = {
        };
        await Share.share(content, options);
    }

    private getOrLoadSerializedAppState = async (): Promise<string> => {
        if (this.state.serializedAppState != null) {
            return this.state.serializedAppState!;
        }
        const serializedAppState = await getSerializedAppState();
        await this.completeSetState({
            serializedAppState,
        });
        return serializedAppState;
    }

    private getBackupText = () => {
        const backupText = `
Random secret: ${this.state.randomSecret}
Content hash: ${this.state.contentHash}
Backup link: ${this.state.backupData}
`;
        return backupText;
    }

    private onBackupData = async () => {
        try {
            const bzz = Swarm.makeBzzApi(this.props.appState.settings.swarmGatewayAddress);
            const serializedAppState = await this.getOrLoadSerializedAppState();
            const contentHash = await backupToSwarm(bzz, serializedAppState, this.state.randomSecret);
            const backupData = await encryptBackupLinkData(contentHash, this.state.randomSecret, this.state.backupPassword);
            this.setState({
                contentHash,
                backupData,
            });
            Clipboard.setString(backupData);
            await this.showShareDialog(backupData);
        } catch (e) {
            Debug.log('sendBackup error', e);
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
