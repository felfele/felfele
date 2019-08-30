import React from 'react';
import { View, SafeAreaView } from 'react-native';
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
}

const ShareButton = (props: {
    selectedFeeds: Feed[],
    onPress: () => void,
}) => (
    <View>
    { props.selectedFeeds.length > 0 &&
        <WideButton
            style={{
                position: 'absolute',
                margin: 0,
                left: 0,
                bottom: 0,
                right: 0,
            }}
            label='Share now'
            icon={<Icon name='send' size={20} color={ComponentColors.BUTTON_COLOR} />}
            onPress={props.onPress}
        />
    }
    </View>
);

export class ShareWithScreen extends React.Component<DispatchProps & StateProps, ShareWithScreenState> {
    public state = {
        selectedFeeds: this.props.selectedFeeds,
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
                <ShareButton
                    selectedFeeds={this.state.selectedFeeds}
                    onPress={this.onShareAll}
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

    private onShareAll = () => {
        this.state.selectedFeeds.map(feed => this.props.onShareWithContact(this.props.post, feed));
        this.props.onDoneSharing();
    }
}
