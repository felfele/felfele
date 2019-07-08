import * as React from 'react';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RefreshableFeed } from '../../../components/RefreshableFeed';
import { Feed } from '../../../models/Feed';
import { Post } from '../../../models/Post';
import { NavigationHeader, HeaderDefaultLeftButtonIcon } from '../../../components/NavigationHeader';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { TypedNavigation } from '../../../helpers/navigation';
import { MutualContact, Contact } from '../../../models/Contact';
import { UnknownContact } from '../../../helpers/contactHelpers';
import { PublicProfile } from '../../../models/Profile';
import { Colors } from '../../../styles';

export interface DispatchProps {
    onConfirmContact: (contact: MutualContact) => void;
    onRemoveContact: (contact: Contact) => void;
    onRefreshPosts: (feeds: Feed[]) => void;
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

const Icon = (props: {name: string, color?: string | undefined}) =>
    <MaterialCommunityIcon name={props.name} size={24} color={props.color} />;

export const ContactView = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const refreshableFeedProps = {
        ...props,
        feeds: [props.feed],
    };
    const mutualContact = props.contact.type === 'mutual-contact'
        ? props.contact
        : undefined
    ;
    const contactName = mutualContact != null
        ? mutualContact.name
        : 'Contact'
    ;
    const rightButton1 = mutualContact != null
        ? {
            onPress: () => props.navigation.navigate('ContactInfo', { publicKey: mutualContact.identity.publicKey }),
            label: <Icon name='dots-vertical' color={Colors.WHITE} />,
        }
        : undefined
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
                    rightButton1={rightButton1}
                    title={contactName}
                />,
            }}
        </RefreshableFeed>
    );
};
