import * as React from 'react';

import { RefreshableFeed } from '../../../components/RefreshableFeed';
import { Feed } from '../../../models/Feed';
import { Post } from '../../../models/Post';
import { NavigationHeader, HeaderDefaultLeftButtonIcon } from '../../../components/NavigationHeader';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { TypedNavigation } from '../../../helpers/navigation';
import { MutualContact, Contact } from '../../../models/Contact';

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
}

type Props = StateProps & DispatchProps;

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
            }}
        </RefreshableFeed>
    );
};
