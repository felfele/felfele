import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '@felfele/felfele-core';
import { Post } from '@felfele/felfele-core';
import { FeedHeader } from './FeedHeader';
import { NavigationHeader } from './NavigationHeader';
import { ImageData } from '@felfele/felfele-core';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { TypedNavigation } from '../helpers/navigation';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
    onSaveDraft: (draft: Post) => void;
}

export interface StateProps {
    navigation: TypedNavigation;
    posts: Post[];
    feeds: Feed[];
    profileImage: ImageData;
    gatewayAddress: string;
}

type Props = StateProps & DispatchProps;

export const YourFeedView = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    return (
        <RefreshableFeed modelHelper={modelHelper} {...props}>
            {{
                navigationHeader: <NavigationHeader
                                      title='All your posts'
                                      navigation={props.navigation}
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
