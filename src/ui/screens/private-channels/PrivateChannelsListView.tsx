import React from 'react';
import { ContactFeed } from '../../../models/ContactFeed';
import { TypedNavigation } from '../../../helpers/navigation';
import { FragmentSafeAreaViewForTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { ContactGrid } from '../contact/ContactGrid';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ComponentColors } from '../../../styles';
import { WideButton } from '../../buttons/WideButton';

export interface DispatchProps {
    onPressChannel: (feed: ContactFeed) => void;
    onAddChannel: () => void;
}

export interface FeedSection {
    title?: string;
    data: ContactFeed[];
}

export interface StateProps {
    navigation: TypedNavigation;
    sections: FeedSection[];
    gatewayAddress: string;
    headerComponent?: React.ComponentType<any> | React.ReactElement<any> | null;
}

export const PrivateChannelsListView = (props: DispatchProps & StateProps) => (
    <FragmentSafeAreaViewForTabBar>
        <NavigationHeader
            navigation={props.navigation}
            title='All private channels'
            rightButton1={{
                label: <Icon name='account-plus' size={24} color={ComponentColors.NAVIGATION_BUTTON_COLOR} />,
                onPress: props.onAddChannel,
            }}
        />
        <ContactGrid
            sections={props.sections}
            gatewayAddress={props.gatewayAddress}
            onPressFeed={props.onPressChannel}
            headerComponent={
                <WideButton
                    label='New private channel'
                    icon={<Icon name='account-plus' size={24} color={ComponentColors.BUTTON_COLOR} />}
                    onPress={props.onAddChannel}
                />
            }
        >
        </ContactGrid>
    </FragmentSafeAreaViewForTabBar>
);
