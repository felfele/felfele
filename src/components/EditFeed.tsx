import * as React from 'react';
import {
    TextInput,
    Alert,
    StyleSheet,
    Button,
    View,
    Text,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import QRCode from 'react-native-qrcode-svg';
// import QRCodeScanner from 'react-native-qrcode-scanner';

import { RSSFeedManager, RSSPostManager } from '../RSSPostManager';
import { Utils } from '../Utils';
import { Feed } from '../models/Feed';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';

interface EditFeedNavigationActions {
    back?: () => void;
    add?: () => void;
}

const navigationActions: EditFeedNavigationActions = {
    back: undefined,
    add: undefined,
};

const QRCodeWidth = 160;
const QRCodeHeight = QRCodeWidth;
const QRCameraWidth = 200;
const QRCameraHeight = QRCameraWidth;

interface EditFeedState {
    url: string;
    checked: boolean;
    loading: boolean;
}

export interface DispatchProps {
    onAddFeed: (feed: Feed) => void;
    onRemoveFeed: (feed: Feed) => void;
}

export interface StateProps {
    feed: Feed;
    navigation: any;
}

export class EditFeed extends React.Component<DispatchProps & StateProps, EditFeedState> {
    public static navigationOptions = {
        header: undefined,
        title: 'Edit feed',
        headerLeft: <Button title='Back' onPress={() => navigationActions.back!()} />,
    };

    public state: EditFeedState = {
        url: '',
        checked: false,
        loading: false,
    };

    constructor(props) {
        super(props);
        this.state.url = this.props.feed.feedUrl;
        navigationActions.back = this.goBack.bind(this);
        navigationActions.add = this.onAdd.bind(this);
    }

    public async onAdd(feed: Feed) {
        this.props.onAddFeed(feed);
        this.goBack();
    }

    public goBack() {
        this.props.navigation.goBack();
    }

    public async fetchFeed() {
        this.setState({
            loading: true,
        });

        const url = Utils.getCanonicalUrl(this.state.url);
        Debug.log('fetchFeed: url: ', url);
        const feed = await this.fetchFeedFromUrl(url);
        Debug.log('fetchFeed: feed: ', feed);

        if (feed != null && feed.feedUrl !== '') {
            this.setState({
                checked: true,
                loading: false,
            });
            await this.onAdd(feed);
        } else {
            this.onFailedFeedLoad();
        }
    }

    public render() {
        return (
            <View style={styles.container}>
                <SimpleTextInput
                    defaultValue={this.state.url}
                    style={styles.linkInput}
                    onChangeText={(text) => this.setState({ url: text })}
                    placeholder='Link of the feed'
                    autoCapitalize='none'
                    autoFocus={true}
                    autoCorrect={false}
                />
                { this.state.checked
                  ?
                    <View style={styles.centerIcon}>
                        <Ionicons name='md-checkmark' size={40} color='green' />
                    </View>
                  : this.state.loading
                    ?
                        <View style={styles.centerIcon}>
                            <ActivityIndicator size='large' color='grey' />
                        </View>
                    : this.props.feed.feedUrl.length > 0
                        ? <this.ExistingItemView />
                        : <this.NewItemView />
                }
            </View>
        );
    }

    private NewItemView = (props) => {
        return (
            <View>
                <Button
                    title='Fetch'
                    onPress={async () => await this.fetchFeed()}
                    disabled={this.state.loading}
                />
                <View style={styles.qrCameraContainer}>
                    {/* <QRCodeScanner
                        onRead={this.onScanSuccess}
                        containerStyle={{
                            width: QRCameraWidth,
                            height: QRCameraHeight,
                        }}
                        cameraStyle={{
                            width: QRCameraWidth,
                            height: QRCameraHeight,
                        }}
                        fadeIn={false}
                    /> */}
                </View>
            </View>
        );
    }

    private ExistingItemView = (props) => {
        const qrCodeValue = JSON.stringify(this.props.feed);
        return (
            <View>
                <Button
                    title='Delete'
                    onPress={async () => this.onDelete()}
                    disabled={this.state.loading}
                />
                <View style={styles.qrCodeContainer}>
                    {/* <QRCode
                        value={qrCodeValue}
                        size={QRCodeWidth}
                        color={Colors.DARK_GRAY}
                        backgroundColor={Colors.BACKGROUND_COLOR}
                    /> */}
                </View>
            </View>
        );
    }

    private fetchFeedFromUrl = async (url: string): Promise<Feed | null> => {
        try {
            const feed = await RSSFeedManager.fetchFeedFromUrl(url);
            Debug.log('fetchFeedFromUrl: feed: ', feed);
            return feed;
        } catch (e) {
            Debug.log(e);
            return null;
        }
    }

    private onDelete = () => {
        const options: any[] = [
            { text: 'Yes', onPress: async () => await this.deleteFeedAndGoBack() },
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

    private onScanSuccess = (event) => {
        try {
            Debug.log(event);
            const feed = JSON.parse(event.data) as Feed;
            this.onAdd(feed);
        } catch (e) {
            Debug.log(e);
        }
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#EFEFF4',
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
        height: 40,
        backgroundColor: '#EFEFF4',
        paddingTop: 10,
    },
    qrCodeContainer: {
        marginTop: 10,
        width: QRCodeWidth,
        height: QRCodeHeight,
        padding: 0,
        alignSelf: 'center',
    },
    qrCameraContainer: {
        width: 200,
        height: 200,
        padding: 0,
        alignSelf: 'center',
    },
});
