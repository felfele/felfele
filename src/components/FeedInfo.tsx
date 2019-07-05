import * as React from 'react';
import {
    Alert,
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Dimensions,
    Clipboard,
    RegisteredStyle,
    ViewStyle,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import QRCodeScanner from 'react-native-qrcode-scanner';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';

import * as urlUtils from '../helpers/urlUtils';
import { Feed } from '../models/Feed';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';
import { ComponentColors, Colors, defaultMediumFont } from '../styles';
import * as Swarm from '../swarm/Swarm';
import { NavigationHeader } from './NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { unfollowFeed } from './FeedView';
import { TypedNavigation } from '../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../ui/misc/FragmentSafeAreaView';
import { WideButton } from '../ui/buttons/WideButton';
import { RegularText } from '../ui/misc/text';
import { showShareFeedDialog } from '../helpers/shareDialogs';
import { getFeedUrlFromFollowLink, getInviteCodeFromInviteLink } from '../helpers/deepLinking';
import { advanceContactState, createCodeReceivedContact, ProfileData } from '../helpers/contactHelpers';
import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import { SECOND } from '../DateUtils';
import { fetchFeedFromUrl, fetchRecentPostFeed, isContactFeed } from '../helpers/feedHelpers';
import { InviteCode } from '../models/InviteCode';
import { Contact } from '../models/Contact';
import { PublicProfile } from '../models/Profile';

const QRCodeWidth = Dimensions.get('window').width * 0.8;
const QRCodeHeight = QRCodeWidth;
const QRCameraWidth = Dimensions.get('window').width;
const QRCameraHeight = QRCameraWidth;

interface FeedInfoState {
    url: string;
    loading: boolean;
    showQRCamera: boolean;
    activityText: string;
}

export interface DispatchProps {
    onAddFeed: (feed: Feed) => void;
    onRemoveFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;

    onAddContact: (contact: Contact) => void;
}

export interface StateProps {
    swarmGateway: string;
    feed: Feed;
    navigation: TypedNavigation;
    isKnownFeed: boolean;
    profile: PublicProfile;
}

type Props = DispatchProps & StateProps;

export class FeedInfo extends React.Component<Props, FeedInfoState> {
    public state: FeedInfoState = {
        url: '',
        loading: false,
        showQRCamera: false,
        activityText: '',
    };

    constructor(props: Props) {
        super(props);
        this.state.url = this.props.feed.feedUrl;
    }

    public async componentDidMount() {
        await this.tryToAddLinkFromClipboard();
        this.setState({
            showQRCamera: true,
        });
    }

    public render() {
        const isExistingFeed = this.props.feed.feedUrl.length > 0;
        const isFollowed = this.props.feed.followed;

        const icon = (name: string, size: number = 20) => <Icon name={name} size={size} color={ComponentColors.NAVIGATION_BUTTON_COLOR} />;
        const button = (iconName: string, onPress: () => void) => ({
            label: icon(iconName),
            onPress,
        });

        const rightButton1 = isExistingFeed
            ? isFollowed
                ? button('link-off', this.onUnfollowFeed)
                : this.props.isKnownFeed
                    ? button('delete', this.onDelete)
                    : undefined
            : undefined
        ;

        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <NavigationHeader
                    title={isExistingFeed ? this.props.feed.name : 'Add channel'}
                    leftButton={{
                        label: icon('close', 24),
                        onPress: () => this.props.navigation.goBack(null),
                    }}
                    rightButton1={rightButton1}
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
                        editable={!isExistingFeed}
                        returnKeyType='done'
                        onSubmitEditing={async () => await this.handleLink(this.state.url)}
                        onEndEditing={() => {}}
                    />
                    { this.state.loading
                    ?
                        <View style={styles.centerIcon}>
                            <Text style={styles.activityText}>{this.state.activityText}</Text>
                            <ActivityIndicator size='large' color='grey' />
                        </View>
                    : this.props.feed.feedUrl.length > 0
                        ? <this.ExistingItemView />
                        : <this.NewItemView showQRCamera={this.state.showQRCamera} />
                    }
                </View>
            </FragmentSafeAreaViewWithoutTabBar>
        );
    }

    private NewItemView = (props: { showQRCamera: boolean }) => {
        if (props.showQRCamera) {
            return (
                <View>
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
            );
        } else {
            return null;
        }
    }

    private ExistingItemView = () => {
        const qrCodeValue = this.props.feed.feedUrl;
        return (
            <View>
                <View style={styles.qrCodeContainer}>
                    <QRCode
                        value={qrCodeValue}
                        size={QRCodeWidth}
                        color={Colors.BLACK}
                        backgroundColor={ComponentColors.BACKGROUND_COLOR}
                    />
                </View>
                <RegularText style={styles.qrCodeText}>Show this QR code or use the link</RegularText>
                <WideButton
                    label='SHARE'
                    icon={<Icon name='share' size={24} color={Colors.BRAND_PURPLE} />}
                    style={{marginTop: 20}}
                    onPress={async () => showShareFeedDialog(this.props.feed)}
                />
            </View>
        );
    }

    private async handleLink(link: string) {
        Debug.log('FeedInfo.processLink', 'this.state', this.state);
        if (this.state.loading === true) {
            return;
        }

        this.setState({
            loading: true,
            activityText: 'Loading channel...',
        });

        const feedUrlFromFollowLink = getFeedUrlFromFollowLink(link);
        if (feedUrlFromFollowLink != null) {
            this.handleFeedUrl(feedUrlFromFollowLink);
            return;
        }
        const inviteCode = getInviteCodeFromInviteLink(link);
        if (inviteCode != null) {
            this.handleInviteCode(inviteCode);
            return;
        }
        const feedUrl = link;
        this.handleFeedUrl(feedUrl);
    }

    private async handleFeedUrl(feedUrl: string) {
        const feed = await fetchFeedFromUrl(feedUrl, this.props.swarmGateway);
        this.setState({
            loading: false,
        });
        if (feed != null && isContactFeed(feed) && feed.contact != null) {
            const contact = feed.contact;
            this.props.onAddContact(contact);
            this.props.navigation.navigate('ContactView', {
                publicKey: contact.identity.publicKey,
                feed,
            });
        }
        else if (feed != null && feed.feedUrl !== '') {
            this.props.onAddFeed(feed);
            this.props.navigation.navigate('Feed', {
                feedUrl: feed.feedUrl,
                name: feed.name,
            });
        } else {
            this.onFailedFeedLoad();
        }
    }

    private async handleInviteCode(inviteCode: InviteCode) {
        const swarmContactHelper = createSwarmContactHelper(
            this.props.profile,
            this.props.swarmGateway,
            generateSecureRandom
        );
        const invitedContact = await createCodeReceivedContact(inviteCode.randomSeed, inviteCode.contactPublicKey, swarmContactHelper);
        const contact = await advanceContactState(invitedContact, swarmContactHelper, 300 * SECOND);
        Debug.log('tryGetFeedUrlFromFollowLink', contact);
        if (contact.type === 'mutual-contact') {
            this.props.onAddContact(contact);
            const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(contact.identity);
            const feed = await fetchRecentPostFeed(feedAddress, this.props.swarmGateway);
            if (feed != null && feed.feedUrl !== '') {
                this.props.navigation.navigate('ContactView', {
                    publicKey: contact.identity.publicKey,
                    feed,
                });
            }
        } else {
            this.onFailedFeedLoad();
        }
    }

    private tryToAddLinkFromClipboard = async () => {
        const isExistingFeed = this.props.feed.feedUrl.length > 0;
        if (!isExistingFeed) {
            const value = await Clipboard.getString();
            const link = urlUtils.getLinkFromText(value);
            if (link != null) {
                this.setState({
                    url: link,
                });
                Clipboard.setString('');
                await this.handleLink(link);
            }
        }
    }

    private onUnfollowFeed = () => {
        unfollowFeed(this.props.feed, this.props.onUnfollowFeed);
    }

    private onDelete = () => {
        const options: any[] = [
            { text: 'Yes', onPress: () => this.props.onRemoveFeed(this.props.feed) },
            { text: 'Cancel', onPress: () => Debug.log('Cancel Pressed'), style: 'cancel' },
        ];

        Alert.alert('Are you sure you want to delete the channel?',
            undefined,
            options,
            { cancelable: true },
        );
    }

    private onFailedFeedLoad = () => {
        const options: any[] = [
            { text: 'Cancel', onPress: () => Debug.log('Cancel Pressed'), style: 'cancel' },
        ];

        Alert.alert('Failed to load channel!',
            undefined,
            options,
            { cancelable: true },
        );

        this.setState({
            loading: false,
    });
    }

    private onScanSuccess = async (data: any) => {
        try {
            Debug.log('FeedInfo.onScanSuccess', 'data', data);
            const inviteLink = getInviteCodeFromInviteLink(data);
            const feedUrl = inviteLink != null
                ? inviteLink
                : data;
            this.setState({
                url: feedUrl,
            });
            await this.handleLink(feedUrl);
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
    centerIcon: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'column',
        height: 100,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        paddingTop: 50,
    },
    qrCodeContainer: {
        marginTop: 10,
        width: QRCodeWidth,
        height: QRCodeHeight,
        padding: 0,
        alignSelf: 'center',
    },
    qrCodeText: {
        fontSize: 14,
        color: Colors.GRAY,
        marginTop: 20,
        marginLeft: 10,
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
    qrCameraText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.GRAY,
        alignSelf: 'center',
    },
    activityText: {
        fontSize: 14,
        color: Colors.GRAY,
        alignSelf: 'center',
        marginBottom: 10,
    },
});
