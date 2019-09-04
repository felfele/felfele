import * as React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { MutualContact } from '../../../models/Contact';
import { TypedNavigation } from '../../../helpers/navigation';
import { Colors, ComponentColors } from '../../../styles';
import { TwoButton } from '../../buttons/TwoButton';
import { IllustrationWithExplanation } from '../../misc/IllustrationWithExplanation';
import * as Swarm from '../../../swarm/Swarm';
import { fetchRecentPostFeed } from '../../../helpers/feedHelpers';
// @ts-ignore
import Balloon from '../../../../images/balloon.svg';

export interface StateProps {
    contact: MutualContact;
    navigation: TypedNavigation;
    gatewayAddress: string;
    isReceiver: boolean;
}

export type Props = StateProps;

export const ContactSuccess = (props: Props) => {
    const leftButton = props.isReceiver
        ? {
            label: 'Go back',
            style: { marginTop: 20 },
            icon: <Icon name='arrow-left' color={Colors.BRAND_PURPLE} size={24}/>,
            onPress: () => props.navigation.popToTop(),
        }
        : {
            label: 'Show your contact info',
            style: { marginTop: 20 },
            icon: <Icon name='account-circle' color={Colors.BRAND_PURPLE} size={24}/>,
            onPress: () => props.navigation.popToTop(),
        };
    return (
        <FragmentSafeAreaViewWithoutTabBar>
            <NavigationHeader
                title={props.contact.name}
                navigation={props.navigation}
                leftButton={{
                    onPress: () => props.navigation.popToTop(),
                    label: <Icon
                                name={'close'}
                                size={20}
                                color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                            />,
                }}
            />
            <View>
                <IllustrationWithExplanation
                    title={'Yay!'}
                    topic={'You’re now connected with Roger.'}
                    explanation={'Use your private channel to share amazing things with each other!'}
                >
                    <Balloon width={36} height={58}/>
                </IllustrationWithExplanation>
                <TwoButton
                    leftButton={leftButton}
                    rightButton={{
                        label: 'Go to channel',
                        style: { marginTop: 20 },
                        icon: <Icon name='arrow-right' color={Colors.BRAND_PURPLE} size={24}/>,
                        onPress: async () => {
                            const feedAddress = Swarm.makeFeedAddressFromPublicIdentity(props.contact.identity);
                            const feed = await fetchRecentPostFeed(feedAddress, props.gatewayAddress);
                            if (feed != null && feed.feedUrl !== '') {
                                props.navigation.replace('ContactView', {
                                    feed,
                                    publicKey: props.contact.identity.publicKey,
                                });
                            } else {
                                props.navigation.popToTop();
                            }
                        },
                    }}
                />
            </View>
        </FragmentSafeAreaViewWithoutTabBar>
    );
};
