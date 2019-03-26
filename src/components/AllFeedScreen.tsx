import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader } from './NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles';
import { ImageData } from '../models/ImageData';
import { FeedHeader } from './FeedHeader';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import SplashScreen from 'react-native-splash-screen';
import { TypedNavigation, Routes } from '../helpers/navigation';

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
                    navigationHeader: <NavigationHeader
                                    title='All feeds'
                                    rightButton1={{
                                        onPress: () => this.props.navigation.navigate('FeedListViewerContainer', {
                                            showExplore: true,
                                        }),
                                        label: <Icon
                                            name={'view-grid'}
                                            size={20}
                                            color={Colors.DARK_GRAY}
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
