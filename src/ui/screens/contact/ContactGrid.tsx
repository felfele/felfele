import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { SuperGridSectionList } from 'react-native-super-grid';

import { ContactFeed } from '../../../models/ContactFeed';
import { getGridCardSize, GridCard } from '../../misc/GridCard';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { ComponentColors, Colors } from '../../../styles';
import { getFeedImage } from '../../../helpers/feedHelpers';
import { defaultImages } from '../../../defaultImages';
import { MediumText } from '../../misc/text';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { Feed } from '../../../models/Feed';

export interface DispatchProps {
    onPressFeed: (feed: ContactFeed | Feed) => void;
}

export interface FeedSection {
    title?: string;
    data: ContactFeed[] | Feed [];
}

export interface StateProps {
    sections: FeedSection[];
    gatewayAddress: string;
    headerComponent?: React.ComponentType<any> | React.ReactElement<any> | null;
    isSelected?: (contactFeed: ContactFeed) => boolean;
}

const calculateGridImageStyle = (itemDimension: number) => {
    const margin = 12;
    const width = itemDimension - margin * 2;
    const height = width;
    const borderRadius = width / 2;
    return {
        margin,
        width,
        height,
        borderRadius,
        backgroundColor: Colors.LIGHTER_GRAY,
    };
};

export class ContactGrid extends React.PureComponent<DispatchProps & StateProps & { children?: React.ReactNode}> {
    public render() {
        const itemDimension = getGridCardSize();
        const imageStyle = calculateGridImageStyle(itemDimension);
        const modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
        return (
            <View style={{ backgroundColor: ComponentColors.BACKGROUND_COLOR, flex: 1 }}>
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
                                imageStyle={imageStyle}
                                onPress={() => this.props.onPressFeed(item)}
                                size={itemDimension}
                                defaultImage={defaultImages.defaultUser}
                                modelHelper={modelHelper}
                                isSelected={this.props.isSelected
                                    ? this.props.isSelected(item)
                                    : false
                                }
                            />
                        );
                    }}
                    // @ts-ignore - SuperGridSectionList is passing props to internal SectionList, typings is missing
                    renderSectionHeader={({ section }) => ( section.title &&
                        <MediumText style={styles.sectionHeader}>{section.title}</MediumText>
                    )}
                    // @ts-ignore - SuperGridSectionList is passing props to internal SectionList, typings is missing
                    ListFooterComponent={<TabBarPlaceholder color={ComponentColors.BACKGROUND_COLOR}/>}
                    ListHeaderComponent={this.props.headerComponent}
                />
                }
            </View>
        );
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
