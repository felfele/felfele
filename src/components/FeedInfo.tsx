import * as React from 'react';
import {
    Alert,
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Dimensions,
    Clipboard,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import QRCodeScanner, { Event as ScanEvent } from 'react-native-qrcode-scanner';

import { RSSFeedManager } from '../RSSPostManager';
import { Utils } from '../Utils';
import { Feed } from '../models/Feed';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';
import { Colors } from '../styles';
import * as Swarm from '../swarm/Swarm';
import { downloadRecentPostFeed } from '../swarm-social/swarmStorage';
import { NavigationHeader } from './NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { unfollowFeed } from './FeedView';

const QRCodeWidth = Dimensions.get('window').width * 0.6;
const QRCodeHeight = QRCodeWidth;
const QRCameraWidth = Dimensions.get('window').width * 0.6;
const QRCameraHeight = QRCameraWidth;

interface FeedInfoState {
    url: string;
    loading: boolean;
    showQRCamera: boolean;
    activityText: string;
}

export interface DispatchProps {
    onAddFeed: (feed: Feed) => void;
    onRemoveFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;
}

export interface StateProps {
    swarmGateway: string;
    feed: Feed;
    navigation: any;
}

type Props = DispatchProps & StateProps;

export class FeedInfo extends React.Component<Props, FeedInfoState> {
    public state: FeedInfoState = {
        url: '',
        loading: false,
        showQRCamera: false,
        activityText: '',
    };

    constructor(props: Props) {
        super(props);
        this.state.url = this.props.feed.feedUrl;
    }

    public async componentDidMount() {
        await this.tryToAddFeedFromClipboard();
        this.setState({
            showQRCamera: true,
        });
    }

    public async onAdd(feed: Feed) {
        this.props.onAddFeed(feed);
    }

    public goBack() {
        this.props.navigation.goBack();
    }

    public async fetchFeed(onSuccess?: () => void, feedUrl?: string) {
        Debug.log('fetchFeed', 'this.state', this.state);
        if (this.state.loading === true) {
            return;
        }

        this.setState({
            loading: true,
            activityText: 'Loading feed',
        });

        const url = feedUrl != null ? feedUrl : this.state.url;
        const feed = await this.fetchFeedFromUrl(url);
        if (feed != null && feed.feedUrl !== '') {
            this.setState({
                loading: false,
            });
            if (onSuccess != null) {
                onSuccess();
            }
            this.onAdd(feed);
            this.props.navigation.navigate('Feed', { feedUrl: feed.feedUrl, name: feed.name });
        } else {
            this.onFailedFeedLoad();
        }
    }

    public render() {
        const isExistingFeed = this.props.feed.feedUrl.length > 0;
        const isFollowed = this.props.feed.followed;
        const rightButtonText1 = this.state.loading
            ? undefined
            : <Icon
                  name={isExistingFeed
                    ? isFollowed
                        ? 'link-variant-off'
                        : 'delete'
                    : 'download'}
                  size={20}
                  color={Colors.DARK_GRAY}
              />
        ;
        const rightButtonAction1 = this.state.loading
            ? undefined
            : isExistingFeed
                ? isFollowed
                    ? this.onUnfollowFeed
                    : () => this.onDelete()
                : async () => await this.onScanSuccess('https://www.wired.com/feed/category/photo/latest/rss')
        ;

        const rightButtonText2 = this.state.loading || !isExistingFeed
            ? undefined
            : <Icon
                  name={'open-in-new'}
                  size={20}
                  color={Colors.DARK_GRAY}
              />
        ;
        const rightButtonAction2 = this.state.loading || !isExistingFeed
            ? undefined
            : () => this.props.navigation.navigate('Feed', { feedUrl: this.props.feed.feedUrl, name: this.props.feed.name })
        ;
        return (
            <View style={styles.container}>
                <NavigationHeader
                    onPressLeftButton={() => {
                        // null is needed otherwise it does not work with switchnavigator backbehavior property
                        this.props.navigation.goBack(null);
                    }}
                    title={isExistingFeed ? 'Feed Info' : 'Add Feed'}
                    rightButtonText1={rightButtonText1}
                    onPressRightButton1={rightButtonAction1}
                    rightButtonText2={rightButtonText2}
                    onPressRightButton2={rightButtonAction2}
                />
                <SimpleTextInput
                    defaultValue={this.state.url}
                    style={styles.linkInput}
                    onChangeText={(text) => this.setState({ url: text })}
                    placeholder='Link of the feed'
                    autoCapitalize='none'
                    autoFocus={true}
                    autoCorrect={false}
                    editable={!isExistingFeed}
                    returnKeyType='done'
                    onSubmitEditing={async () => await this.fetchFeed()}
                    onEndEditing={() => {}}
                />
                { this.state.loading
                ?
                    <View style={styles.centerIcon}>
                        <Text style={styles.activityText}>{this.state.activityText}</Text>
                        <ActivityIndicator size='large' color='grey' />
                    </View>
                : this.props.feed.feedUrl.length > 0
                    ? <this.ExistingItemView />
                    : <this.NewItemView showQRCamera={this.state.showQRCamera} />
                }
            </View>
        );
    }

    private NewItemView = (props: { showQRCamera: boolean }) => {
        if (props.showQRCamera) {
            return (
                <View>
                    <View style={styles.qrCameraContainer}>
                        <QRCodeScanner
                            onRead={async (event) => await this.onScanSuccess(event.data)}
                            containerStyle={styles.qrCameraStyle}
                            cameraStyle={styles.qrCameraStyle}
                            fadeIn={false}
                            cameraProps={{ratio: '1:1'}}
                        />
                    </View>
                    <Text style={styles.qrCameraText}>You can scan a QR code too</Text>
                </View>
            );
        } else {
            return null;
        }
    }

    private ExistingItemView = () => {
        const qrCodeValue = this.props.feed.feedUrl;
        return (
            <View>
                <View style={styles.qrCodeContainer}>
                    <QRCode
                        value={qrCodeValue}
                        size={QRCodeWidth}
                        color={Colors.DARK_GRAY}
                        backgroundColor={Colors.BACKGROUND_COLOR}
                    />
                </View>
            </View>
        );
    }

    private tryToAddFeedFromClipboard = async () => {
        const isExistingFeed = this.props.feed.feedUrl.length > 0;
        if (!isExistingFeed) {
            const value = await Clipboard.getString();
            const link = Utils.getLinkFromText(value);
            if (link != null) {
                this.setState({
                    url: link,
                });
                const clearClipboard = () => Clipboard.setString('');
                await this.fetchFeed(clearClipboard);
            }
        }
    }

    private fetchFeedFromUrl = async (url: string): Promise<Feed | null> => {
        if (url.startsWith(Swarm.defaultFeedPrefix)) {
            const feedAddress = Swarm.makeFeedAddressFromBzzFeedUrl(url);
            const swarm = Swarm.makeReadableApi(feedAddress, this.props.swarmGateway);
            const feed: Feed = await downloadRecentPostFeed(swarm, url, 60 * 1000);
            return feed;
        } else {
            Debug.log('fetchFeedFromUrl', 'url', url);
            const canonicalUrl = Utils.getCanonicalUrl(url);
            Debug.log('fetchFeedFromUrl', 'canonicalUrl', canonicalUrl);
            const feed = await this.fetchRSSFeedFromUrl(canonicalUrl);
            Debug.log('fetchFeedFromUrl', 'feed', feed);
            return feed;
        }
    }

    private fetchRSSFeedFromUrl = async (url: string): Promise<Feed | null> => {
        try {
            const feed = await RSSFeedManager.fetchFeedFromUrl(url);
            Debug.log('fetchFeedFromUrl: feed: ', feed);
            return feed;
        } catch (e) {
            Debug.log(e);
            return null;
        }
    }

    private onUnfollowFeed = () => {
        unfollowFeed(this.props.feed, this.unfollowAndGoBack);
    }

    private unfollowAndGoBack = (feed: Feed) => {
        this.props.onUnfollowFeed(feed);
        this.goBack();
    }

    private onDelete = () => {
        const options: any[] = [
            { text: 'Yes', onPress: () => this.deleteFeedAndGoBack() },
            { text: 'Cancel', onPress: () => Debug.log('Cancel Pressed'), style: 'cancel' },
        ];

        Alert.alert('Are you sure you want to delete the feed?',
            undefined,
            options,
            { cancelable: true },
        );
    }

    private onFailedFeedLoad = () => {
        const options: any[] = [
            { text: 'Cancel', onPress: () => Debug.log('Cancel Pressed'), style: 'cancel' },
        ];

        Alert.alert('Failed to load feed!',
            undefined,
            options,
            { cancelable: true },
        );

        this.setState({
            loading: false,
        });
    }

    private deleteFeedAndGoBack = () => {
        this.props.onRemoveFeed(this.props.feed);
        this.goBack();
    }

    private onScanSuccess = async (data: any) => {
        try {
            Debug.log('FeedInfo.onScanSuccess', 'data', data);
            const feedUrl = data;
            this.setState({
                url: feedUrl,
            });
            await this.fetchFeed(undefined, feedUrl);
        } catch (e) {
            Debug.log(e);
        }
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.BACKGROUND_COLOR,
        flex: 1,
        flexDirection: 'column',
    },
    titleInfo: {
        fontSize: 14,
        color: '#8e8e93',
    },
    linkInput: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: 'gray',
        fontSize: 16,
    },
    deleteButtonContainer: {
        backgroundColor: 'white',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    centerIcon: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'column',
        height: 100,
        backgroundColor: Colors.BACKGROUND_COLOR,
        paddingTop: 50,
    },
    qrCodeContainer: {
        marginTop: 10,
        width: QRCodeWidth,
        height: QRCodeHeight,
        padding: 0,
        alignSelf: 'center',
    },
    qrCameraContainer: {
        width: QRCameraWidth,
        height: QRCameraHeight,
        padding: 0,
        alignSelf: 'center',
        flexDirection: 'column',
    },
    qrCameraStyle: {
        width: QRCameraWidth,
        height: QRCameraHeight,
    },
    qrCameraText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.GRAY,
        alignSelf: 'center',
    },
    activityText: {
        fontSize: 14,
        color: Colors.GRAY,
        alignSelf: 'center',
        marginBottom: 10,
    },
});
