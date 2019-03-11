import * as React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { Feed } from '../models/Feed';
import { Colors } from '../styles';
import { NavigationHeader } from './NavigationHeader';
import { Props as NavHeaderProps } from './NavigationHeader';
import { SuperGridSectionList } from 'react-native-super-grid';
import { GridCard, getGridCardSize } from '../ui/misc/GridCard';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { MediumText } from '../ui/misc/text';
import { TabBarPlaceholder } from '../ui/misc/TabBarPlaceholder';

export interface DispatchProps {
    onPressFeed: (navigation: any, feed: Feed) => void;
}

export interface StateProps {
    navigation: any;
    ownFeeds: Feed[];
    followedFeeds: Feed[];
    knownFeeds: Feed[];
    gatewayAddress: string;
    title: string;
}

export class FeedGrid extends React.PureComponent<DispatchProps & StateProps & { children?: React.ReactElement<NavHeaderProps>}> {
    public render() {
        const itemDimension = getGridCardSize();
        const modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
        const sections: Array<{ title: string, data: Feed[] }> = [];
        if (this.props.ownFeeds.length > 0) {
            sections.push({
                title: `Your feeds ${this.props.ownFeeds.length}`,
                data: this.props.ownFeeds,
            });
        }
        if (this.props.followedFeeds.length > 0) {
            sections.push({
                title: `Public feeds you follow  ${this.props.followedFeeds.length}`,
                data: this.props.followedFeeds,
            });
        }
        if (this.props.knownFeeds.length > 0) {
            sections.push({
                title: `Other feeds  ${this.props.knownFeeds.length}`,
                data: this.props.knownFeeds,
            });
        }
        return (
            <View style={{ backgroundColor: Colors.BACKGROUND_COLOR, flex: 1 }}>
                {this.props.children}
                <SuperGridSectionList
                    style={{ flex: 1 }}
                    spacing={10}
                    fixed={true}
                    itemDimension={itemDimension}
                    sections={sections}
                    renderItem={({ item }: any) => {
                        const imageUri = item.authorImage ? modelHelper.getImageUri(item.authorImage) : item.favicon;
                        return (
                            <GridCard
                                title={item.name}
                                imageUri={imageUri}
                                onPress={() => this.props.onPressFeed(this.props.navigation, item)}
                                size={itemDimension}
                            />
                        );
                    }}
                    renderSectionHeader={({ section }) => (
                        <MediumText style={styles.sectionHeader}>{section.title}</MediumText>
                    )}
                    // @ts-ignore - SuperGridSectionList is passing props to internal SectionList, typings is missing
                    ListFooterComponent={<TabBarPlaceholder color={Colors.BACKGROUND_COLOR}/>}
                />
            </View>
        );
    }
}

export class FeedListEditor extends React.PureComponent<DispatchProps & StateProps> {
    public render() {
        return (
            <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
                <FeedGrid {...this.props}>
                    <NavigationHeader
                        withoutSafeArea={true}
                        onPressLeftButton={() => {
                            // null is needed otherwise it does not work with switchnavigator backbehavior property
                            this.props.navigation.goBack(null);
                        }}
                        rightButtonText1={<MaterialIcon name='add-box' size={24} color={Colors.BUTTON_COLOR} />}
                        onPressRightButton1={this.onAddFeed}
                        title={this.props.title}
                    />
                </FeedGrid>
            </SafeAreaView>
        );
    }

    private onAddFeed = () => {
        const feed: Feed = {
            favicon: '',
            feedUrl: '',
            name: '',
            url: '',
        };
        this.props.navigation.navigate('FeedInfo', { feed: feed });
    }
}

const styles = StyleSheet.create({
    sectionHeader: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.DARK_GRAY,
        backgroundColor: Colors.BACKGROUND_COLOR,
        fontSize: 14,
    },
});
