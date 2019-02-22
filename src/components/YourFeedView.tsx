import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { FeedHeader } from './FeedHeader';
import { NavigationHeader } from './NavigationHeader';
import { ImageData } from '../models/ImageData';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onSavePost: (post: Post) => void;
}

export interface StateProps {
    navigation: any;
    posts: Post[];
    feeds: Feed[];
    profileImage: ImageData;
}

type Props = StateProps & DispatchProps;

export const YourFeedView = (props: Props) => {
    return (
        <RefreshableFeed {...props}>
            {{
                navigationHeader: <NavigationHeader
                                      title='All your posts'
                                      onPressLeftButton={() => props.navigation.goBack(null)}
                                />,
                listHeader: <FeedHeader
                                navigation={props.navigation}
                                onSavePost={props.onSavePost}
                                profileImage={props.profileImage}
                            />,
            }}
        </RefreshableFeed>
    );
};
