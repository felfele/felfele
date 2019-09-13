import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { StateProps, DispatchProps } from '../FeedLoader';
import { TypedNavigation } from '../../../helpers/navigation';
import { FeedLoader } from '../FeedLoader';
import { Alert } from 'react-native';
import { fetchRSSFeedFromUrl } from '../../../helpers/feedHelpers';
import { Debug } from '../../../Debug';
import { AsyncActions } from '../../../actions/asyncActions';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    const inviteCode = ownProps.navigation.getParam<'ContactLoader', 'inviteCode'>('inviteCode');
    return {
        title: inviteCode.profileName,
        navigation: ownProps.navigation,
    };
};

export const mapDispatchToProps = (dispatch: any, ownProps: { navigation: TypedNavigation }): DispatchProps => {
    return {
        onLoad: async () => {
            const feedUrl = ownProps.navigation.getParam<'RSSFeedLoader', 'feedUrl'>('feedUrl');
            const feed = await fetchRSSFeedFromUrl(feedUrl);
            if (feed != null && feed.feedUrl !== '') {
                dispatch(AsyncActions.addFeed(feed));
                dispatch(AsyncActions.downloadPostsFromFeeds([feed]));
                ownProps.navigation.navigate('Feed', {
                    feedUrl: feed.feedUrl,
                    name: feed.name,
                });
            } else {
                onFailedFeedLoad();
            }
        },
    };
};

const onFailedFeedLoad = () => {
    const options: any[] = [
        { text: 'Cancel', onPress: () => Debug.log('Cancel Pressed'), style: 'cancel' },
    ];

    Alert.alert(
        'Failed to load channel!',
        undefined,
        options,
        { cancelable: true },
    );
};

export const RSSFeedLoaderContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedLoader);
