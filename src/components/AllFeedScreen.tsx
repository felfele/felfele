import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader } from './NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles';
import { ImageData } from '../models/ImageData';
import { FeedHeader } from './FeedHeader';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onSaveDraft: (post: Post) => void;
}

export interface StateProps {
    navigation: any;
    posts: Post[];
    feeds: Feed[];
    profileImage: ImageData;
}

type Props = StateProps & DispatchProps;

export const AllFeedScreen = (props: Props) => {
    return (
        <RefreshableFeed {...props}>
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
                            />,
            }}
        </RefreshableFeed>
    );
};
