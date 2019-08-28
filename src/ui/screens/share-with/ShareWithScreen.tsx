import React from 'react';
import { ContactFeed } from '../../../models/ContactFeed';
import { TypedNavigation } from '../../../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import {
    ContactGrid,
    StateProps as ContactGridStateProps,
    DispatchProps as ContactGridDispatchProps,
} from '../contact/ContactGrid';
import { Post } from '../../../models/Post';

export interface DispatchProps {
    onDoneSharing: () => void;
    onShareWithContact: (post: Post, contactFeed: ContactFeed) => void;
}

export interface FeedSection {
    title?: string;
    data: ContactFeed[];
}

export interface StateProps {
    post: Post;
    navigation: TypedNavigation;
    sections: FeedSection[];
    gatewayAddress: string;
    headerComponent?: React.ComponentType<any> | React.ReactElement<any> | null;
}

interface StatefulContactGridProps extends ContactGridStateProps, ContactGridDispatchProps {
    selectedFeeds: ContactFeed[];
}

interface StatefulContactGridState {
    selectedFeeds: ContactFeed[];
}

class StatefulContactGrid extends React.PureComponent<StatefulContactGridProps, StatefulContactGridState> {
    public state = {
        selectedFeeds: this.props.selectedFeeds,
    };

    public render() {
        return (
            <ContactGrid
                sections={this.props.sections}
                gatewayAddress={this.props.gatewayAddress}
                onPressFeed={this.onPressFeed}
                isSelected={this.isSelected}
            />
        );
    }

    private isSelected = (feed: ContactFeed) => this.state.selectedFeeds.find(selectedFeed => feed.feedUrl === selectedFeed.feedUrl) != null;

    private onPressFeed = (feed: ContactFeed) => {
        this.setState({
            selectedFeeds: [...this.state.selectedFeeds, feed],
        });
        this.props.onPressFeed(feed);
    }
}

export const ShareWithScreen = (props: DispatchProps & StateProps) => (
    <FragmentSafeAreaViewWithoutTabBar>
        <NavigationHeader
            navigation={props.navigation}
            title='Share with...'
            rightButton1={{
                label: 'Done',
                onPress: props.onDoneSharing,
            }}
        />
        <StatefulContactGrid
            sections={props.sections}
            gatewayAddress={props.gatewayAddress}
            onPressFeed={(feed) => props.onShareWithContact(props.post, feed)}
            isSelected={() => true}
            selectedFeeds={[]}
        />
    </FragmentSafeAreaViewWithoutTabBar>
);
