import * as React from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
} from 'react-native';

import { Feed } from '../../models/Feed';
import { ComponentColors, Colors } from '../../styles';
import { NavigationHeader } from '../../components/NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as AreYouSureDialog from '../../components/AreYouSureDialog';
import { TypedNavigation } from '../../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../misc/FragmentSafeAreaView';
import { TwoButton } from '../buttons/TwoButton';
import { RegularText } from '../misc/text';
import { showShareFeedDialog } from '../../helpers/shareDialogs';
import { ImageDataView } from '../../components/ImageDataView';
import { getFeedImage } from '../../helpers/feedHelpers';
import { ReactNativeModelHelper } from '../../models/ReactNativeModelHelper';

export interface DispatchProps {
    onAddFeed: (feed: Feed) => void;
    onRemoveFeed: (feed: Feed) => void;
    onUnfollowFeed: (feed: Feed) => void;
}

export interface StateProps {
    feed: Feed;
    navigation: TypedNavigation;
    swarmGateway: string;
}

type Props = DispatchProps & StateProps;

const PUBLIC_CHANNEL_LABEL = 'This is a public channel.';
const NOT_FOLLOWED_STATUS = 'You are not following it.';
const FOLLOWED_STATUS = 'You are following it.';

export class WebFeedInfo extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const modelHelper = new ReactNativeModelHelper(this.props.swarmGateway);
        const imageWidth = Dimensions.get('window').width * 0.7;
        const followToggleButton = this.props.feed.followed
            ? {
                label: 'Unfollow',
                icon: <Icon name='link-off' size={24} color={Colors.DARK_RED}/>,
                style: styles.buttonStyle,
                fontStyle: { color: Colors.DARK_RED },
                onPress: this.onUnfollowFeed,
            }
            : {
                label: 'Follow',
                icon: <Icon name='link' size={24} color={Colors.BRAND_PURPLE}/>,
                style: styles.buttonStyle,
                onPress: () => this.props.onAddFeed(this.props.feed),
            }
        ;
        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <NavigationHeader
                    title={this.props.feed.name}
                    navigation={this.props.navigation}
                />
                <View style={styles.container}>
                    <ImageDataView
                        source={getFeedImage(this.props.feed)}
                        modelHelper={modelHelper}
                        style={{
                            width: imageWidth,
                            height: imageWidth,
                            alignSelf: 'center',
                            marginVertical: 20,
                        }}
                        resizeMode='cover'
                    />
                    <RegularText style={styles.explanationText}>{PUBLIC_CHANNEL_LABEL}</RegularText>
                    <RegularText style={styles.explanationText}>{
                        this.props.feed.followed
                            ? FOLLOWED_STATUS
                            : NOT_FOLLOWED_STATUS
                    }</RegularText>
                    <TwoButton
                        leftButton={followToggleButton}
                        rightButton={{
                            label: 'Share link',
                            icon: <Icon name='share' size={24} color={Colors.BRAND_PURPLE}/>,
                            style: styles.buttonStyle,
                            onPress: async () => showShareFeedDialog(this.props.feed),
                        }}
                    />
                </View>
            </FragmentSafeAreaViewWithoutTabBar>
        );
    }

    private onUnfollowFeed = async () => {
        const confirmUnfollow = await AreYouSureDialog.show(
            'Are you sure you want to unfollow?',
            'This will remove this channel from your Public channels feed and you will no longer get updates from it.'
        );
        if (confirmUnfollow) {
            this.props.onUnfollowFeed(this.props.feed);
        }
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        flex: 1,
        flexDirection: 'column',
    },
    explanationText: {
        color: ComponentColors.HINT_TEXT_COLOR,
        textAlign: 'center',
    },
    buttonStyle: {
        marginTop: 20,
    },
});
