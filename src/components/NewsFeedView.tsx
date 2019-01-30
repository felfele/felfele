import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { Settings } from '../models/Settings';
import { NavigationHeader } from './NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles';

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
                                rightButtonText1={
                                    <Icon
                                        name={'format-list-bulleted'}
                                        size={20}
                                        color={Colors.DARK_GRAY}
                                    />
                                }
                                onPressRightButton1={() => props.navigation.navigate('FeedListViewerContainer', { feeds: props.feeds })}
                            />,
            }}
        </RefreshableFeed>
    );
};
