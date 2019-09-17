import * as React from 'react';
import {
    Alert,
    StyleSheet,
    View,
    Dimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Feed } from '../models/Feed';
import { SimpleTextInput } from './SimpleTextInput';
import { Debug } from '../Debug';
import { ComponentColors, Colors, defaultMediumFont } from '../styles';
import { NavigationHeader } from './NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { unfollowFeed } from './FeedView';
import { TypedNavigation } from '../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../ui/misc/FragmentSafeAreaView';
import { WideButton } from '../ui/buttons/WideButton';
import { RegularText } from '../ui/misc/text';
import { showShareFeedDialog } from '../helpers/shareDialogs';
import { PublicProfile } from '../models/Profile';

const QRCodeWidth = Dimensions.get('window').width * 0.8;
const QRCodeHeight = QRCodeWidth;
const QRCameraWidth = Dimensions.get('window').width;
const QRCameraHeight = QRCameraWidth;

interface FeedInfoState {
    url: string;
}

export interface DispatchProps {
    onRemoveFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;
}

export interface StateProps {
    swarmGateway: string;
    feed: Feed;
    navigation: TypedNavigation;
    isKnownFeed: boolean;
    profile: PublicProfile;
}

type Props = DispatchProps & StateProps;

export class FeedInfo extends React.Component<Props, FeedInfoState> {
    public state: FeedInfoState = {
        url: '',
    };

    constructor(props: Props) {
        super(props);
        this.state.url = this.props.feed.feedUrl;
    }

    public render() {
        const isFollowed = this.props.feed.followed;

        const icon = (name: string, size: number = 20) => <Icon name={name} size={size} color={ComponentColors.NAVIGATION_BUTTON_COLOR} />;
        const button = (iconName: string, onPress: () => void) => ({
            label: icon(iconName),
            onPress,
        });

        const rightButton1 = isFollowed
            ? button('link-off', this.onUnfollowFeed)
            : this.props.isKnownFeed
                ? button('delete', this.onDelete)
                : undefined
        ;

        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <NavigationHeader
                    title={this.props.feed.name}
                    leftButton={{
                        label: icon('close', 24),
                        onPress: () => this.props.navigation.goBack(null),
                    }}
                    rightButton1={rightButton1}
                    navigation={this.props.navigation}
                />
                <View style={styles.container}>
                    <SimpleTextInput
                        defaultValue={this.state.url}
                        style={styles.linkInput}
                        onChangeText={(text) => this.setState({ url: text })}
                        autoCapitalize='none'
                        autoFocus={false}
                        autoCorrect={false}
                        editable={false}
                        returnKeyType='done'
                    />
                    <this.ExistingItemView />
                </View>
            </FragmentSafeAreaViewWithoutTabBar>
        );
    }

    private ExistingItemView = () => {
        const qrCodeValue = this.props.feed.feedUrl;
        return (
            <View>
                <View style={styles.qrCodeContainer}>
                    <QRCode
                        value={qrCodeValue}
                        size={QRCodeWidth}
                        color={Colors.BLACK}
                        backgroundColor={ComponentColors.BACKGROUND_COLOR}
                    />
                </View>
                <RegularText style={styles.qrCodeText}>Show this QR code or use the link</RegularText>
                <WideButton
                    label='SHARE'
                    icon={<Icon name='share' size={24} color={Colors.BRAND_PURPLE} />}
                    style={{marginTop: 20}}
                    onPress={async () => showShareFeedDialog(this.props.feed)}
                />
            </View>
        );
    }

    private onUnfollowFeed = () => {
        unfollowFeed(this.props.feed, this.props.onUnfollowFeed);
    }

    private onDelete = () => {
        const options: any[] = [
            { text: 'Yes', onPress: () => this.props.onRemoveFeed(this.props.feed) },
            { text: 'Cancel', onPress: () => Debug.log('Cancel Pressed'), style: 'cancel' },
        ];

        Alert.alert('Are you sure you want to delete the channel?',
            undefined,
            options,
            { cancelable: true },
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        flex: 1,
        flexDirection: 'column',
    },
    linkInput: {
        width: '100%',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 14,
        color: Colors.DARK_GRAY,
        fontSize: 14,
        fontFamily: defaultMediumFont,
        marginTop: 10,
    },
    qrCodeContainer: {
        marginTop: 10,
        width: QRCodeWidth,
        height: QRCodeHeight,
        padding: 0,
        alignSelf: 'center',
    },
    qrCodeText: {
        fontSize: 14,
        color: Colors.GRAY,
        marginTop: 20,
        marginLeft: 10,
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
});
