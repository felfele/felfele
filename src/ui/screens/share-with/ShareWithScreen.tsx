import React from 'react';
import { View, SafeAreaView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { ContactFeed } from '../../../models/ContactFeed';
import { TypedNavigation } from '../../../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar, FragmentSafeAreaViewForTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import {
    ContactGrid,
    StateProps as ContactGridStateProps,
    DispatchProps as ContactGridDispatchProps,
} from '../contact/ContactGrid';
import { Post } from '../../../models/Post';
import { removeFromArray } from '../../../helpers/immutable';
import { WideButton } from '../../buttons/WideButton';
import { Colors, ComponentColors } from '../../../styles';
import { highestSeenLogicalTime } from '../../../protocols/timeline';
import { Debug } from '../../../Debug';
import { Feed } from '../../../models/Feed';
import { RegularText, MediumText } from '../../misc/text';
import { TouchableView } from '../../../components/TouchableView';

export interface DispatchProps {
    onDoneSharing: () => void;
    onShareWithContact: (post: Post, feed: Feed) => void;
}

export interface FeedSection {
    title?: string;
    data: ContactFeed[];
}

export interface StateProps {
    post: Post;
    selectedFeeds: Feed[];
    navigation: TypedNavigation;
    sections: FeedSection[];
    gatewayAddress: string;
    headerComponent?: React.ComponentType<any> | React.ReactElement<any> | null;
}

interface ShareWithScreenState {
    selectedFeeds: Feed[];
    isSending: boolean;
}

const ShareButtonContainer = (props: {
    selectedFeeds: Feed[],
    onPress: () => void,
    isSending: boolean,
}) => {
    const icon = props.isSending
        ? <ActivityIndicator size='small' color={ComponentColors.NAVIGATION_BUTTON_COLOR} />
        : <Icon name='send' size={24} color={ComponentColors.NAVIGATION_BUTTON_COLOR} />
    ;
    const numSelected = props.selectedFeeds.length;
    return (
        <View>
        { props.selectedFeeds.length > 0 &&
            <View
                style={{
                    position: 'absolute',
                    margin: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    height: 50,
                    flexDirection: 'row',
                    backgroundColor: Colors.WHITE,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <RegularText style={{marginLeft: 10, fontSize: 14}}>{numSelected} selected</RegularText>
                <TouchableView
                    style={{
                        margin: 10,
                        backgroundColor: Colors.BRAND_PURPLE,
                        borderRadius: 3,
                        flexDirection: 'row',
                        width: 115,
                        height: 30,
                        alignItems: 'center',
                        paddingHorizontal: 10,
                    }}
                    onPress={props.onPress}
                >
                    {icon}
                    <MediumText style={{ color: Colors.WHITE, paddingLeft: 5}}>Share now</MediumText>
                </TouchableView>
            </View>
        }
        </View>
    );
};

export class ShareWithScreen extends React.Component<DispatchProps & StateProps, ShareWithScreenState> {
    public state = {
        selectedFeeds: this.props.selectedFeeds,
        isSending: false,
    };

    public render() {
        // this is important to force ContactGrid to be redrawn when
        // selected feeds are changing
        const sections = [...this.props.sections];
        const bottomBackgroundColor = this.state.selectedFeeds.length > 0
            ? Colors.WHITE
            : ComponentColors.BACKGROUND_COLOR
        ;
        return (
            <FragmentSafeAreaViewForTabBar
                bottomBackgroundColor={bottomBackgroundColor}
            >
                <NavigationHeader
                    navigation={this.props.navigation}
                    title='Share with...'
                />
                <ContactGrid
                    sections={sections}
                    gatewayAddress={this.props.gatewayAddress}
                    onPressFeed={this.onPressFeed}
                    isSelected={this.isSelected}
                />
                <ShareButtonContainer
                    selectedFeeds={this.state.selectedFeeds}
                    onPress={this.onShareAll}
                    isSending={false}
                />
            </FragmentSafeAreaViewForTabBar>
        );
    }

    private isSelected = (feed: Feed) => this.state.selectedFeeds.find(selectedFeed => feed.feedUrl === selectedFeed.feedUrl) != null;

    private onPressFeed = (feed: Feed) => {
        const index = this.state.selectedFeeds.findIndex(selectedFeed => feed.feedUrl === selectedFeed.feedUrl);
        if (index === -1) {
            this.setState({
                selectedFeeds: [...this.state.selectedFeeds, feed],
            });
        } else {
            const selectedFeeds = removeFromArray(this.state.selectedFeeds, index);
            this.setState({
                selectedFeeds,
            });
        }
    }

    private onShareAll = async () => {
        await this.setState({
            isSending: true,
        });
        this.state.selectedFeeds.map(feed => this.props.onShareWithContact(this.props.post, feed));
        this.props.onDoneSharing();
    }
}
