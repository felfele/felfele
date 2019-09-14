import * as React from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    Clipboard,
    RegisteredStyle,
    ViewStyle,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

import { Feed } from '../../../models/Feed';
import { SimpleTextInput } from '../../../components/SimpleTextInput';
import { Debug } from '../../../Debug';
import { ComponentColors, Colors, defaultMediumFont } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TypedNavigation } from '../../../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { getInviteCodeFromInviteLink } from '../../../helpers/deepLinking';
import { getFelfeleLinkFromClipboardData } from '../../../helpers/feedInfoHelper';

const QRCameraWidth = Dimensions.get('window').width;
const QRCameraHeight = QRCameraWidth;

interface State {
    url: string;
}

export interface DispatchProps { }

export interface StateProps {
    navigation: TypedNavigation;
}

type Props = DispatchProps & StateProps;

export class FeedLinkReader extends React.Component<Props, State> {
    public state: State = {
        url: '',
    };

    public async componentDidMount() {
        await this.addFelfeleFeedsFromClipboard();
    }

    public render() {
        const icon = (name: string, size: number = 20) =>
            <Icon name={name} size={size} color={ComponentColors.NAVIGATION_BUTTON_COLOR} />;

        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <NavigationHeader
                    title={'Add channel'}
                    leftButton={{
                        label: icon('close', 24),
                        onPress: () => this.props.navigation.goBack(null),
                    }}
                    navigation={this.props.navigation}
                />
                <View style={styles.container}>
                    <SimpleTextInput
                        defaultValue={this.state.url}
                        style={styles.linkInput}
                        onChangeText={(text) => this.setState({ url: text })}
                        placeholder='Scan QR code or paste link here'
                        placeholderTextColor={Colors.MEDIUM_GRAY}
                        autoCapitalize='none'
                        autoFocus={false}
                        autoCorrect={false}
                        returnKeyType='done'
                        onSubmitEditing={async () => await this.handleLink(this.state.url)}
                        onEndEditing={() => {}}
                    />
                    <View style={styles.qrCameraContainer}>
                        <QRCodeScanner
                            onRead={async (event) => await this.onScanSuccess(event.data)}
                            containerStyle={styles.qrCameraStyle as any as RegisteredStyle<ViewStyle>}
                            cameraStyle={styles.qrCameraStyle as any as RegisteredStyle<ViewStyle>}
                            fadeIn={false}
                            cameraProps={{ratio: '1:1'}}
                        />
                    </View>
                </View>
            </FragmentSafeAreaViewWithoutTabBar>
        );
    }

    private handleLink(link: string) {
        Debug.log('FeedLinkReader.processLink', 'this.state', this.state, 'link', link);
        const inviteCode = getInviteCodeFromInviteLink(link);
        if (inviteCode != null) {
            this.props.navigation.replace('ContactConfirm', { inviteCode });
            return;
        }
        this.props.navigation.replace('RSSFeedLoader', { feedUrl: link });
    }

    private addFelfeleFeedsFromClipboard = async () => {
        const data = await Clipboard.getString();
        const link = getFelfeleLinkFromClipboardData(data);
        if (link != null) {
            this.setState({
                url: link,
            });
            Clipboard.setString('');
            await this.handleLink(link);
        }
    }

    private onScanSuccess = async (data: any) => {
        try {
            Debug.log('FeedLinkReader.onScanSuccess', 'data', data);
            this.setState({
                url: data,
            });
            await this.handleLink(data);
        } catch (e) {
            Debug.log(e);
        }
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        flex: 1,
        flexDirection: 'column',
    },
    linkInput: {
        width: '100%',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 14,
        color: Colors.DARK_GRAY,
        fontSize: 14,
        fontFamily: defaultMediumFont,
        marginTop: 10,
    },
    qrCameraContainer: {
        width: QRCameraWidth,
        height: QRCameraHeight,
        padding: 0,
        alignSelf: 'center',
        flexDirection: 'column',
    },
    qrCameraStyle: {
        width: QRCameraWidth,
        height: QRCameraHeight,
    },
});
