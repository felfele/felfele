import * as React from 'react';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RefreshableFeed } from '../../../components/RefreshableFeed';
import { Feed } from '../../../models/Feed';
import { Post } from '../../../models/Post';
import { NavigationHeader, HeaderDefaultLeftButtonIcon } from '../../../components/NavigationHeader';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { TypedNavigation } from '../../../helpers/navigation';
import { MutualContact, Contact } from '../../../models/Contact';
import { View, StyleSheet, LayoutAnimation } from 'react-native';
import { calculateVerificationCode } from '../../../helpers/contactHelpers';
import { RegularText, MediumText } from '../../misc/text';
import { TwoButton } from '../../buttons/TwoButton';
import { PublicProfile } from '../../../models/Profile';
import { PublicIdentity } from '../../../models/Identity';
import { Colors } from '../../../styles';
import { ImageDataView } from '../../../components/ImageDataView';
import { defaultImages } from '../../../defaultImages';

export interface DispatchProps {
    onConfirmContact: (contact: MutualContact) => void;
    onRemoveContact: (contact: Contact) => void;
    onRefreshPosts: (feeds: Feed[]) => void;
}

export interface UnknownContact {
    type: 'unknown-contact';
}

export interface StateProps {
    navigation: TypedNavigation;
    onBack: () => void;
    contact: Contact | UnknownContact;
    posts: Post[];
    feed: Feed;
    gatewayAddress: string;
    profile: PublicProfile;
}

type Props = StateProps & DispatchProps;

const VerificationCodeView = (props: {
    contact: MutualContact,
    ownIdentity: PublicIdentity,
    gatewayAddress: string,
    onConfirmContact: (contact: MutualContact) => void;
    onRemoveContact: (contact: Contact) => void;
}) => {
    const verificationCode = calculateVerificationCode(props.contact.identity.publicKey);
    const yourVerificationCode = calculateVerificationCode(props.ownIdentity.publicKey);
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <View style={styles.verificationContainer}>
            <ImageDataView
                source={props.contact.image}
                defaultImage={defaultImages.defaultUser}
                style={styles.profileImage}
                modelHelper={modelHelper}
            />
            <RegularText>Verification code</RegularText>
            <MediumText>{verificationCode}</MediumText>
            <RegularText>Your code</RegularText>
            <MediumText>{yourVerificationCode}</MediumText>
            <TwoButton
                leftButton={{
                    label: 'Confirm',
                    icon: <MaterialCommunityIcon name='account-check' size={24} color={Colors.BRAND_PURPLE} />,
                    onPress: () => {
                        LayoutAnimation.linear();
                        props.onConfirmContact(props.contact);
                    },
                }}
                rightButton={{
                    label: 'Cancel',
                    icon: <MaterialCommunityIcon name='account-alert' size={24} color={Colors.BRAND_PURPLE} />,
                    onPress: () => props.onRemoveContact(props.contact),
                }}
            />
        </View>
    );
};

const VerificationView = (props: {
    contact: Contact | UnknownContact,
    ownIdentity: PublicIdentity,
    gatewayAddress: string,
    onConfirmContact: (contact: MutualContact) => void;
    onRemoveContact: (contact: Contact) => void;
 }) => {
    return props.contact.type === 'mutual-contact' && props.contact.confirmed === false
        ? <VerificationCodeView {...props} contact={props.contact} />
        : null
    ;
};

export const ContactView = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const refreshableFeedProps = {
        ...props,
        feeds: [props.feed],
    };
    const contactName = props.contact.type === 'mutual-contact'
        ? props.contact.name
        : 'Contact'
    ;
    return (
        <RefreshableFeed modelHelper={modelHelper} {...refreshableFeedProps}>
            {{
                navigationHeader: <NavigationHeader
                    navigation={props.navigation}
                    leftButton={{
                        onPress: props.onBack,
                        label: HeaderDefaultLeftButtonIcon,
                    }}
                    title={contactName}
                />,
                listHeader: <VerificationView
                    contact={props.contact}
                    ownIdentity={props.profile.identity}
                    gatewayAddress={props.gatewayAddress}
                    onConfirmContact={props.onConfirmContact}
                    onRemoveContact={props.onRemoveContact}
                />,
            }}
        </RefreshableFeed>
    );
};

const styles = StyleSheet.create({
    verificationContainer: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        marginBottom: 10,
        padding: 10,
    },
    profileImage: {
        borderRadius : 72.5,
        width: 145,
        height: 145,
        marginVertical: 10,
    },
});
