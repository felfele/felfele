import * as React from 'react';
import { YourFeed } from './YourFeed';
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
    knownFeeds: Feed[];
    settings: Settings;
}

type Props = StateProps & DispatchProps;

export const NewsFeedView = (props: Props) => {
    return (
        <YourFeed {...props}>
            {{
                listHeader: <NavigationHeader
                            leftButtonText=''
                            title='News'
                        />,
            }}
        </YourFeed>
    );
};

export const MemoizedNewsFeedView = React.memo(NewsFeedView);
