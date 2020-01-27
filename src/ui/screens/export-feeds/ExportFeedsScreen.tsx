import * as React from 'react';
import QRCode from 'react-native-qrcode-svg';
import {
    View,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
    ShareContent,
    Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { NavigationHeader } from '../../../components/NavigationHeader';
import { Colors, ComponentColors, DefaultNavigationBarHeight, defaultMediumFont } from '../../../styles';
import { AppState } from '../../../reducers/AppState';
import { TypedNavigation } from '../../../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { TouchableView } from '../../../components/TouchableView';
import { RegularText } from '../../misc/text';
import { WideButton } from '../../buttons/WideButton';
import { Debug } from '../../../Debug';
import { safeFetch } from '../../../Network';
import { Feed } from '../../../models/Feed';
import { getHttpLinkFromText } from '../../../helpers/urlUtils';

const QRCodeWidth = Dimensions.get('window').width * 0.6;
const FELFELE_FEEDS_MIME_TYPE = 'application/felfele-feeds+json';
const FEEDS_LINK_MESSAGE = 'Here is a link to my Felfele Feeds. Copy this message and open the app! ';
const makeFeedsLinkMessage = (link: string) => {
    const message = `${FEEDS_LINK_MESSAGE}${link}`;
    return message;
};
const errorDialog = async (title: string, errorText?: string, okText: string = 'Ok'): Promise<boolean> => {
    const promise = new Promise<boolean>((resolve) => {
        const options: any[] = [
            { text: okText, onPress: () => resolve(true)},
        ];

        Alert.alert(title,
            errorText,
            options,
            { cancelable: true },
        );
    });

    return promise;
};

const shareDialog = async (title: string, message: string) => {
    const content: ShareContent = {
        title,
        message,
    };
    await Share.share(content);
};

export interface StateProps {
    navigation: TypedNavigation;
    appState: AppState;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

type State = |
    {
        type: 'saving';
    }
    |
    {
        type: 'saved';
        link: string;
    }
;

const QRCodeView = (props: {navigation: TypedNavigation, qrCodeValue: string, onPressShare: () => void}) => (
    <View style={styles.qrViewContainer}>
        <TouchableView style={styles.qrCodeContainer}>
            { props.qrCodeValue != null
            ?
                <QRCode
                    value={props.qrCodeValue}
                    size={QRCodeWidth}
                    color={Colors.BLACK}
                    backgroundColor={ComponentColors.BACKGROUND_COLOR}
                />
            :
                <ActivityIndicator />
        }
        </TouchableView>
        <View style={styles.qrCodeHintContainer}>
            <RegularText style={styles.qrCodeHint}>This is your feeds code.</RegularText>
            <RegularText style={styles.qrCodeHint}>Ask people to scan it or share as a link.</RegularText>
        </View>
        <WideButton
            label='Share link'
            icon={<Icon name='share' size={24} color={Colors.BRAND_PURPLE} />}
            onPress={props.onPressShare}
        />
    </View>
);

const WaitView = () => (
    <View style={styles.container}>
        <View style={styles.centerIcon}>
            <RegularText style={styles.activityText}>Exporting feeds, hang tight...</RegularText>
            <ActivityIndicator size='large' color='grey'/>
        </View>
    </View>
);

const uploadString = async (data: string, swarmGateway: string, headers?: {[key: string]: string}): Promise<string> => {
    Debug.log('uploadString', {data});
    const url = swarmGateway + '/bzz:/';
    const options: RequestInit = {
        headers: headers ?? {
            'Content-Type': 'text/plain',
        },
        method: 'POST',
    };
    options.body = data;
    Debug.log('uploadString', {url});
    const response = await safeFetch(url, options);
    const text = await response.text();
    return url + text + '/';
};

const swarmUpload = async (data: string, swarmGateway: string, headers?: {[key: string]: string}): Promise<string> => {
    try {
        swarmGateway = swarmGateway.endsWith('/')
            ? swarmGateway.substring(0, swarmGateway.length - 1)
            : swarmGateway
        ;
        const bzzLink = await uploadString(data, swarmGateway, headers);
        Debug.log('upload', {bzzLink});
        return bzzLink;
    } catch (e) {
        Debug.log('upload:', {e});
        throw e;
    }
};

const isRssFeed = (feed: Feed): boolean => getHttpLinkFromText(feed.feedUrl) === feed.feedUrl;

const uploadFeeds = async (appState: AppState): Promise<string> => {
    const exportedData = {
        feeds: appState.feeds.filter(isRssFeed),
    };
    const data = JSON.stringify(exportedData);
    const link = await swarmUpload(
        data,
        appState.settings.swarmGatewayAddress,
        {
            'Content-type': FELFELE_FEEDS_MIME_TYPE,
        }
    );
    return link;
};

const showShareFeedsLinkDialog = (link: string) => {
    const title = 'Share your feeds';
    const message = makeFeedsLinkMessage(link);
    shareDialog(title, message);
};

export class ExportFeedsScreen extends React.PureComponent<Props, State> {
    public state: State = {
        type: 'saving',
    };

    public async componentDidMount() {
        try {
            const link = await uploadFeeds(this.props.appState);
            Debug.log('Backup.componentDidMount', {link});
            this.setState({
                type: 'saved',
                link,
            });
        } catch (e) {
            await errorDialog('Error', 'Failed to export feeds, check your network connection', 'Bummer!');
            this.props.navigation.goBack(null);
        }
    }

    public render = () => (
        <FragmentSafeAreaViewWithoutTabBar>
            <NavigationHeader
                title='Export RSS feeds'
                navigation={this.props.navigation}
            />
            { this.state.type === 'saving'
            ? <WaitView />
            : <QRCodeView
                navigation={this.props.navigation}
                qrCodeValue={this.state.link}
                onPressShare={() => showShareFeedsLinkDialog((this.state as any).link)}
            />
            }
        </FragmentSafeAreaViewWithoutTabBar>
    )
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
    qrViewContainer: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        flex: 1,
    },
    qrCodeContainer: {
        marginVertical: 20,
        width: QRCodeWidth,
        height: QRCodeWidth,
        padding: 0,
        alignSelf: 'center',
    },
    qrCodeHintContainer: {
        paddingBottom: 20,
    },
    qrCodeHint: {
        paddingHorizontal: 10,
        color: Colors.GRAY,
        fontSize: 14,
        alignSelf: 'center',
    },
    container: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        flex: 1,
        flexDirection: 'column',
    },
    centerIcon: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'column',
        height: 200,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        paddingTop: 50,
    },
    activityText: {
        fontSize: 16,
        color: Colors.GRAY,
        alignSelf: 'center',
        marginBottom: 30,
    },
});
