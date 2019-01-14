import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { Settings } from '../models/Settings';
import { NavigationHeader } from './NavigationHeader';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
}

export interface StateProps {
    navigation: any;
    posts: Post[];
    feeds: Feed[];
    settings: Settings;
}

type Props = StateProps & DispatchProps;

export const NewsFeedView = (props: Props) => {
    return (
        <RefreshableFeed {...props}>
            {{
                listHeader: <NavigationHeader
                                leftButtonText=''
                                title='News'
                            />,
            }}
        </RefreshableFeed>
    );
};

export const MemoizedNewsFeedView = React.memo(NewsFeedView);
