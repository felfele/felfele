import * as React from 'react';
import { RefreshableFeed } from './RefreshableFeed';
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';
import { NavigationHeader } from './NavigationHeader';
import { Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';

export interface DispatchProps {
    onRefreshPosts: (feeds: Feed[]) => void;
}

export interface StateProps {
    navigation: any;
    posts: Post[];
    feeds: Feed[];
}

type Props = StateProps & DispatchProps;

export const FavoritesFeedView = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper();
    return (
        <RefreshableFeed modelHelper={modelHelper} {...props}>
            {{
                listHeader: <NavigationHeader
                                title='Favorites'
                                rightButtonText1={
                                    <Icon
                                        name={'view-grid'}
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
