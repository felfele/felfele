import * as React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SplashScreen from 'react-native-splash-screen';

import { RefreshableFeed } from '../../../components/RefreshableFeed';
import { Feed } from '../../../models/Feed';
import { Post } from '../../../models/Post';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { ComponentColors } from '../../../styles';
import { ImageData } from '../../../models/ImageData';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { TypedNavigation } from '../../../helpers/navigation';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onSaveDraft: (post: Post) => void;
}

export interface StateProps {
    navigation: TypedNavigation;
    posts: Post[];
    feeds: Feed[];
    profileImage: ImageData;
    gatewayAddress: string;
}

type Props = StateProps & DispatchProps;

export class PublicChannelsScreen extends React.Component<Props> {
    private ref?: RefreshableFeed = undefined;
    public render() {
        const modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
        return (
            <RefreshableFeed
                modelHelper={modelHelper} {...this.props}
                ref={value => this.ref = value || undefined}
            >
                {{
                    navigationHeader:
                        <NavigationHeader
                            title='Public channels'
                            leftButton={{
                                onPress: () => this.props.navigation.navigate('PublicChannelsListContainer', {
                                    showExplore: true,
                                }),
                                label: <Icon
                                    name={'apps'}
                                    size={24}
                                    color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                                />,
                            }}
                            rightButton1={{
                                onPress: () => this.props.navigation.navigate('FeedLinkReader', {}),
                                label: <Icon
                                    name='plus-box'
                                    size={24}
                                    color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                                />,
                            }}
                            onPressTitle={this.ref && this.ref.scrollToTop}
                        />,
                }}
            </RefreshableFeed>
        );
    }

    public componentDidMount() {
        SplashScreen.hide();
    }
}
