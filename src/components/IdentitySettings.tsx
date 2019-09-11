import * as React from 'react';
import QRCode from 'react-native-qrcode-svg';
import {
    KeyboardAvoidingView,
    StyleSheet,
    View,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';
import { withNavigationFocus, NavigationEvents } from 'react-navigation';

import { SimpleTextInput } from './SimpleTextInput';
import { Author } from '../models/Author';
import { ImageData } from '../models/ImageData';
import { Feed } from '../models/Feed';
import { AsyncImagePicker } from '../AsyncImagePicker';
import { ComponentColors, Colors } from '../styles';
import { NavigationHeader } from './NavigationHeader';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { RowItem } from '../ui/buttons/RowButton';
import { RegularText } from '../ui/misc/text';
import { TabBarPlaceholder } from '../ui/misc/TabBarPlaceholder';
import { defaultImages } from '../defaultImages';
import { DEFAULT_AUTHOR_NAME } from '../reducers/defaultData';
import { TypedNavigation } from '../helpers/navigation';
import { LocalFeed } from '../social/api';
import { showShareFeedDialog, showShareContactDialog } from '../helpers/shareDialogs';
import { TwoButton } from '../ui/buttons/TwoButton';
import { ImageDataView } from '../components/ImageDataView';
import { InvitedContact, Contact, MutualContact } from '../models/Contact';
import { Debug } from '../Debug';
import { TouchableView } from './TouchableView';
import { createSwarmContactHelper } from '../helpers/swarmContactHelpers';
import { advanceContactState } from '../helpers/contactHelpers';
import { SECOND } from '../DateUtils';
import { getInviteLink, getFollowLink } from '../helpers/deepLinking';
import { PublicProfile } from '../models/Profile';

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
    showInviteCode: boolean;
}

const NAME_LABEL = 'NAME';
const NAME_PLACEHOLDER = DEFAULT_AUTHOR_NAME;
const SCREEN_TITLE = 'Profile';
const ACTIVITY_LABEL = 'ACTIVITY';
const VIEW_POSTS_LABEL = 'View all your posts';

const QRCodeWidth = Dimensions.get('window').width * 0.6;

const generateInviteQRCodeValue = (invitedContact?: InvitedContact): string | undefined => {
    if (invitedContact == null) {
        return undefined;
    }
    return getInviteLink(invitedContact);
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
            onDidFocus={payload => {
                Debug.log('ContactStateChangeListener.render', 'onDidFocus', this.props);
                this.tryAdvanceContactState();
            }}
            onDidBlur={payload => {
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

export const IdentitySettings = (props: DispatchProps & StateProps) => {
    const qrCodeValue = props.showInviteCode
        ? generateInviteQRCodeValue(props.invitedContact)
        : generateFollowRCodeValue(props.ownFeed)
    ;
    if (props.showInviteCode && qrCodeValue == null) {
        props.onChangeQRCode();
    }
    const onPressShare = props.showInviteCode
        ? () => props.invitedContact && showShareContactDialog(props.invitedContact)
        : () => showShareFeedDialog(props.ownFeed)
    ;
   // Debug.log('IdentitySettings', {qrCodeValue, invitedContact: props.invitedContact});
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <SafeAreaView style={styles.safeAreaContainer}>
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
                    rightButton1={
                        props.ownFeed != null
                            ? {
                                label: <MaterialCommunityIcon
                                    name={'share'}
                                    size={20}
                                    color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                                />,
                                onPress: async () => showShareFeedDialog(props.ownFeed),
                            }
                            : undefined
                    }
                    title={SCREEN_TITLE}
                />
                <ScrollView
                    keyboardShouldPersistTaps='handled'
                >
                    <TouchableOpacity
                        onPress={async () => {
                            await openImagePicker(props.onUpdatePicture);
                        }}
                        style={styles.imagePickerContainer}
                    >
                        <ImageDataView
                            source={props.profile.image}
                            defaultImage={defaultUserImage}
                            style={styles.imagePicker}
                            modelHelper={modelHelper}
                        />
                    </TouchableOpacity>
                    <RegularText style={styles.tooltip}>{NAME_LABEL}</RegularText>
                    <SimpleTextInput
                        style={styles.row}
                        defaultValue={props.profile.name}
                        placeholder={NAME_PLACEHOLDER}
                        autoCapitalize='none'
                        autoFocus={props.profile.name === ''}
                        autoCorrect={false}
                        selectTextOnFocus={true}
                        returnKeyType={'done'}
                        onSubmitEditing={(name) =>
                            name === ''
                            ? props.onUpdateAuthor(NAME_PLACEHOLDER)
                            : props.onUpdateAuthor(name)
                        }
                    />
                    <RegularText style={styles.tooltip}>{ACTIVITY_LABEL}</RegularText>
                    <RowItem
                        title={VIEW_POSTS_LABEL}
                        buttonStyle='navigate'
                        onPress={() => props.navigation.navigate('YourTab', {})}
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
                    <TwoButton
                        leftButton={{
                            label: 'Share',
                            icon: <MaterialCommunityIcon name='share' size={24} color={Colors.BRAND_PURPLE} />,
                            onPress: onPressShare,
                        }}
                        rightButton={{
                            label: 'Add channel',
                            icon: <MaterialCommunityIcon name='account-plus' size={24} color={Colors.BRAND_PURPLE} />,
                            onPress: () => props.navigation.navigate('FeedInfo', {
                                feed: {
                                    name: '',
                                    url: '',
                                    feedUrl: '',
                                    favicon: '',
                                },
                           }),
                        }}
                    />
                </ScrollView>
                <TabBarPlaceholder/>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const openImagePicker = async (onUpdatePicture: (imageData: ImageData) => void) => {
    const imageData = await AsyncImagePicker.showImagePicker();
    if (imageData != null) {
        onUpdatePicture(imageData);
    }
};

const styles = StyleSheet.create({
    safeAreaContainer: {
        backgroundColor: ComponentColors.HEADER_COLOR,
        flex: 1,
    },
    mainContainer: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        flex: 1,
    },
    row: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 10,
        color: Colors.DARK_GRAY,
        fontSize: 14,
    },
    tooltip: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.GRAY,
        fontSize: 12,
    },
    imagePickerContainer: {
        flexDirection: 'row',
        alignSelf: 'center',
    },
    imagePicker: {
        borderRadius : 72.5,
        width: 145,
        height: 145,
        marginVertical: 10,
    },
    qrCodeContainer: {
        marginVertical: 10,
        width: QRCodeWidth,
        height: QRCodeWidth,
        padding: 0,
        alignSelf: 'center',
    },
});
