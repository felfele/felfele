import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import {
    Feed,
    Post,
    ImageData,
} from '@felfele/felfele-core';
import { NavigationHeader } from './NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ComponentColors } from '../styles';
import { FeedHeader } from './FeedHeader';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import SplashScreen from 'react-native-splash-screen';
import { TypedNavigation } from '../helpers/navigation';

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

export class AllFeedScreen extends React.Component<Props> {
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
                            title='Home'
                            leftButton={{
                                onPress: () => this.props.navigation.navigate('FeedListViewerContainer', {
                                    showExplore: true,
                                }),
                                label: <Icon
                                    name={'apps'}
                                    size={24}
                                    color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                                />,
                            }}
                            rightButton1={{
                                onPress: () => this.props.navigation.navigate('FeedInfo', {
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
                            onPressTitle={this.ref && this.ref.scrollToTop}
                        />,
                    listHeader: <FeedHeader
                                    navigation={this.props.navigation}
                                    onSaveDraft={this.props.onSaveDraft}
                                    profileImage={this.props.profileImage}
                                    gatewayAddress={this.props.gatewayAddress}
                                />,
                }}
            </RefreshableFeed>
        );
    }

    public componentDidMount() {
        SplashScreen.hide();
    }
}
