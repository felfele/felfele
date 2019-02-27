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

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onSaveDraft: (post: Post) => void;
}

export interface StateProps {
    navigation: any;
    posts: Post[];
    feeds: Feed[];
    profileImage: ImageData;
    gatewayAddress: string;
}

type Props = StateProps & DispatchProps;

export const AllFeedScreen = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <RefreshableFeed modelHelper={modelHelper} {...props}>
            {{
                navigationHeader: <NavigationHeader
                                title='All feeds'
                                rightButtonText1={
                                    <Icon
                                        name={'view-grid'}
                                        size={20}
                                        color={Colors.DARK_GRAY}
                                    />
                                }
                                onPressRightButton1={() => props.navigation.navigate('FeedListViewerContainer')}
                            />,
                listHeader: <FeedHeader
                                navigation={props.navigation}
                                onSaveDraft={props.onSaveDraft}
                                profileImage={props.profileImage}
                                gatewayAddress={props.gatewayAddress}
                            />,
            }}
        </RefreshableFeed>
    );
};
