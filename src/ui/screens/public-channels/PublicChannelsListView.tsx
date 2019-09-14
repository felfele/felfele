import * as React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SuperGridSectionList } from 'react-native-super-grid';

import { Feed } from '../../../models/Feed';
import { Colors, ComponentColors } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { GridCard, getGridCardSize } from '../../../ui/misc/GridCard';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { MediumText } from '../../../ui/misc/text';
import { TabBarPlaceholder } from '../../../ui/misc/TabBarPlaceholder';
import { defaultImages } from '../../../defaultImages';
import { TypedNavigation } from '../../../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../../../ui/misc/FragmentSafeAreaView';
import { TwoButton } from '../../../ui/buttons/TwoButton';
import { getFeedImage } from '../../../helpers/feedHelpers';
import { ContactFeed } from '../../../models/ContactFeed';

export interface DispatchProps {
    onPressFeed: (feed: ContactFeed) => void;
    openExplore: () => void;
}

export interface FeedSection {
    title?: string;
    data: ContactFeed[];
}

export interface StateProps {
    navigation: TypedNavigation;
    sections: FeedSection[];
    gatewayAddress: string;
    title: string;
    showExplore: boolean;
    headerComponent?: React.ComponentType<any> | React.ReactElement<any> | null;
}

export class FeedGrid extends React.PureComponent<DispatchProps & StateProps & { children?: React.ReactNode}> {
    public render() {
        const itemDimension = getGridCardSize();
        const modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
        return (
            <SafeAreaView style={{ backgroundColor: ComponentColors.BACKGROUND_COLOR, flex: 1 }}>
                {this.props.children}
                {
                // @ts-ignore - SuperGridSectionList is passing props to internal SectionList, typings is missing
                <SuperGridSectionList
                    style={{ flex: 1 }}
                    spacing={10}
                    fixed={true}
                    itemDimension={itemDimension}
                    sections={this.props.sections}
                    renderItem={({ item }: any) => {
                        const image = getFeedImage(item);
                        return (
                            <GridCard
                                title={item.name}
                                image={image}
                                onPress={() => this.props.onPressFeed(item)}
                                size={itemDimension}
                                defaultImage={defaultImages.defaultUser}
                                modelHelper={modelHelper}
                                isSelected={false}
                            />
                        );
                    }}
                    renderSectionHeader={({ section }) => ( section.title &&
                        <MediumText style={styles.sectionHeader}>{section.title}</MediumText>
                    )}
                    // @ts-ignore - SuperGridSectionList is passing props to internal SectionList, typings is missing
                    ListFooterComponent={<TabBarPlaceholder color={ComponentColors.BACKGROUND_COLOR}/>}
                    ListHeaderComponent={this.props.headerComponent}
                />
                }
            </SafeAreaView>
        );
    }
}

const ActionButtons = (openExplore: () => void, openAddChannel: () => void) => (
    <TwoButton
        leftButton={{
            label: 'Add channel',
            icon: <Icon name='plus-box' size={24} color={Colors.BRAND_PURPLE} />,
            onPress: openAddChannel,
        }}
        rightButton={{
            label: 'Explore',
            icon: <Icon name='compass' size={24} color={Colors.BRAND_PURPLE}/>,
            onPress: openExplore,
        }}
    />
);

export class PublicChannelsListView extends React.PureComponent<DispatchProps & StateProps> {
    public render() {
        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <FeedGrid
                    headerComponent={this.props.showExplore
                        ? ActionButtons(this.props.openExplore, this.onAddFeed)
                        : undefined
                    }
                    {...this.props}
                >
                    <NavigationHeader
                        navigation={this.props.navigation}
                        title={this.props.title}
                        rightButton1={{
                            label: <Icon name='plus-box' size={24} color={ComponentColors.NAVIGATION_BUTTON_COLOR} />,
                            onPress: this.onAddFeed,
                        }}
                    />
                </FeedGrid>
            </FragmentSafeAreaViewWithoutTabBar>
        );
    }

    private onAddFeed = () => {
        this.props.navigation.navigate('FeedLinkReader', {});
    }
}

const styles = StyleSheet.create({
    sectionHeader: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.DARK_GRAY,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        fontSize: 14,
    },
});
