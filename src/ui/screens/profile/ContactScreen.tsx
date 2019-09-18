import * as React from 'react';
import QRCode from 'react-native-qrcode-svg';
import {
    KeyboardAvoidingView,
    StyleSheet,
    View,
    Dimensions,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';
import { NavigationEvents } from 'react-navigation';

import { ImageData } from '../../../models/ImageData';
import { Feed } from '../../../models/Feed';
import { ComponentColors, Colors } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { RegularText } from '../../misc/text';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { defaultImages } from '../../../defaultImages';
import { TypedNavigation } from '../../../helpers/navigation';
import { LocalFeed } from '../../../social/api';
import { showShareContactDialog } from '../../../helpers/shareDialogs';
import { TwoButton } from '../../buttons/TwoButton';
import { ImageDataView } from '../../../components/ImageDataView';
import { InvitedContact, Contact, MutualContact } from '../../../models/Contact';
import { Debug } from '../../../Debug';
import { TouchableView } from '../../../components/TouchableView';
import { createSwarmContactHelper } from '../../../helpers/swarmContactHelpers';
import { advanceContactState } from '../../../helpers/contactHelpers';
import { SECOND } from '../../../DateUtils';
import { getInviteLink, getFollowLink } from '../../../helpers/deepLinking';
import { PublicProfile } from '../../../models/Profile';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { RowItem } from '../../buttons/RowButton';

const defaultUserImage = defaultImages.defaultUser;

export interface DispatchProps {
    onUpdateAuthor: (text: string) => void;
    onUpdatePicture: (image: ImageData) => void;
    onChangeText?: (text: string) => void;
    onChangeQRCode: () => void;
    onAddFeed: (feed: Feed) => void;
    onContactStateChange: (contact: InvitedContact, updatedContact: Contact) => void;
    onReachingMutualContactState: (contact: MutualContact) => void;
}

export interface StateProps {
    profile: PublicProfile;
    ownFeed?: LocalFeed;
    navigation: TypedNavigation;
    gatewayAddress: string;
    invitedContact?: InvitedContact;
}

const SCREEN_TITLE = 'Contact';

const QRCodeWidth = Dimensions.get('window').width * 0.6;

const generateInviteQRCodeValue = (profileName: string, invitedContact?: InvitedContact): string | undefined => {
    if (invitedContact == null) {
        return undefined;
    }
    return getInviteLink(invitedContact, profileName);
};

const generateFollowRCodeValue = (feed?: Feed): string | undefined => {
    if (feed == null) {
        return undefined;
    }
    return getFollowLink(feed.feedUrl);
};

interface ContactStateChangeListenerProps {
    contact: InvitedContact;
    profile: PublicProfile;
    swarmGateway: string;
    navigation: TypedNavigation;

    onContactStateChanged: (invitedContact: InvitedContact, updatedContact: Contact) => void;
    onReachingMutualContactState: (contact: MutualContact) => void;
    onAddFeed: (feed: Feed) => void;
}

class ContactStateChangeListener extends React.PureComponent<ContactStateChangeListenerProps> {
    private isCanceled = false;

    public render = () => (
        <NavigationEvents
            onDidFocus={() => {
                Debug.log('ContactStateChangeListener.render', 'onDidFocus', this.props);
                this.tryAdvanceContactState();
            }}
            onDidBlur={() => {
                Debug.log('ContactStateChangeListener.render', 'onDidBlur', this.props);
                this.isCanceled = true;
            }}
        />
    )

    private async tryAdvanceContactState() {
        this.isCanceled = false;
        const swarmContactHelper = createSwarmContactHelper(
            this.props.profile,
            this.props.swarmGateway,
            generateSecureRandom,
            () => this.isCanceled,
        );
        const contact = await advanceContactState(this.props.contact, swarmContactHelper, 300 * SECOND);
        Debug.log('ContactStateChangeListener.componentDidMount', contact);
        this.props.onContactStateChanged(this.props.contact, contact);
        if (contact.type === 'mutual-contact') {
            this.props.onReachingMutualContactState(contact);
            this.props.navigation.navigate('ContactSuccess', {
                contact,
                isReceiver: false,
            });
        }
    }
}

export const ContactScreen = (props: DispatchProps & StateProps) => {
    const qrCodeValue = generateInviteQRCodeValue(props.profile.name, props.invitedContact);
    if (qrCodeValue == null) {
        props.onChangeQRCode();
    }
    const onPressShare = () => props.invitedContact && showShareContactDialog(props.invitedContact, props.profile.name);

    return (
        <FragmentSafeAreaViewWithoutTabBar>
            { props.invitedContact &&
                <ContactStateChangeListener
                    contact={props.invitedContact}
                    profile={props.profile}
                    swarmGateway={props.gatewayAddress}
                    onContactStateChanged={props.onContactStateChange}
                    onReachingMutualContactState={props.onReachingMutualContactState}
                    onAddFeed={props.onAddFeed}
                    navigation={props.navigation}
                />
            }
            <KeyboardAvoidingView style={styles.mainContainer}>
                <NavigationHeader
                    title={SCREEN_TITLE}
                />
                <ScrollView
                    keyboardShouldPersistTaps='handled'
                >
                    <RowItem
                        title='Edit profile'
                        buttonStyle='navigate'
                        containerStyle={styles.editProfileContainer}
                        icon={<ImageDataView
                                source={props.profile.image}
                                defaultImage={defaultUserImage}
                                style={styles.profileImage}
                                modelHelper={new ReactNativeModelHelper(props.gatewayAddress)}
                            />
                        }
                        onPress={() => props.navigation.navigate('EditProfileContainer', {})}
                    />
                    <TouchableView style={styles.qrCodeContainer} onLongPress={props.onChangeQRCode}>
                    { qrCodeValue != null
                        ?
                            <QRCode
                                value={qrCodeValue}
                                size={QRCodeWidth}
                                color={Colors.BLACK}
                                backgroundColor={ComponentColors.BACKGROUND_COLOR}
                            />
                        :
                            <ActivityIndicator />
                    }
                    </TouchableView>
                    <View style={styles.qrCodeHintContainer}>
                        <RegularText style={styles.qrCodeHint}>This is your contact code.</RegularText>
                        <RegularText style={styles.qrCodeHint}>Ask people to scan it or share a link.</RegularText>
                    </View>
                    <TwoButton
                        leftButton={{
                            label: 'Share link',
                            icon: <MaterialCommunityIcon name='share' size={24} color={Colors.BRAND_PURPLE} />,
                            onPress: onPressShare,
                        }}
                        rightButton={{
                            label: 'Scan a QR code',
                            icon: <MaterialCommunityIcon name='crop-free' size={24} color={Colors.BRAND_PURPLE} />,
                            onPress: () => props.navigation.navigate('FeedLinkReader', {}),
                        }}
                    />
                </ScrollView>
                <TabBarPlaceholder/>
            </KeyboardAvoidingView>
        </FragmentSafeAreaViewWithoutTabBar>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        flex: 1,
    },
    editProfileContainer: {
        paddingLeft: 0,
        marginTop: 10,
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
    profileImage: {
        width: 44,
        height: 44,
        margin: 0,
    },
    qrCodeContainer: {
        marginVertical: 20,
        width: QRCodeWidth,
        height: QRCodeWidth,
        padding: 0,
        alignSelf: 'center',
    },
});
