import * as React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Feed } from '../../../models/Feed';
import { Post } from '../../../models/Post';
import { RefreshableFeed } from '../../../components/RefreshableFeed';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { Colors, ComponentColors } from '../../../styles';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { PlaceholderCard } from '../../misc/PlaceholderCard';
import { TypedNavigation } from '../../../helpers/navigation';
import { ContactFeed } from '../../../models/ContactFeed';

export interface DispatchProps {
    onRefreshPosts: (feeds: ContactFeed[]) => void;
}

export interface StateProps {
    navigation: TypedNavigation;
    posts: Post[];
    feeds: ContactFeed[];
    gatewayAddress: string;
}

type Props = StateProps & DispatchProps;

const PLACEHOLDER_TEXT_1 = "You don't have private channels.";
const PLACEHOLDER_TEXT_2 = 'Add a contact with the button on the top rigth corner.';

export const PrivateChannelsFeedView = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <RefreshableFeed modelHelper={modelHelper} {...props}>
            {{
                navigationHeader:
                    <NavigationHeader
                        title='Private Channels'
                        leftButton={{
                            onPress: () => props.navigation.navigate(
                                'PrivateChannelListContainer', {
                                    contactFeeds: props.feeds,
                                }
                            ),
                            label: <Icon
                                name={'apps'}
                                size={24}
                                color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                            />,
                        }}
                        rightButton1={{
                            onPress: () => props.navigation.navigate('FeedInfo', {
                                 feed: {
                                     name: '',
                                     url: '',
                                     feedUrl: '',
                                     favicon: '',
                                 },
                            }),
                            label: <Icon
                                name='account-plus'
                                size={24}
                                color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                            />,
                        }}
                    />,
                placeholder: <PlaceholderCard
                                 boldText={PLACEHOLDER_TEXT_1}
                                 regularText={PLACEHOLDER_TEXT_2}
                                 image={<Icon
                                            name='account-multiple'
                                            size={48}
                                            color={Colors.BLACK}
                                />}
                             />,
            }}
        </RefreshableFeed>
    );
};
