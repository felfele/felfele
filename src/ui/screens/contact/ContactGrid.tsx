import * as React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { SuperGridSectionList } from 'react-native-super-grid';

import { ContactFeed } from '../../../models/ContactFeed';
import { getGridCardSize, GridCard } from '../../misc/GridCard';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { ComponentColors, Colors } from '../../../styles';
import { getFeedImage } from '../../../helpers/feedHelpers';
import { defaultImages } from '../../../defaultImages';
import { MediumText } from '../../misc/text';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';

export interface DispatchProps {
    onPressFeed: (feed: ContactFeed) => void;
}

export interface FeedSection {
    title?: string;
    data: ContactFeed[];
}

export interface StateProps {
    sections: FeedSection[];
    gatewayAddress: string;
    headerComponent?: React.ComponentType<any> | React.ReactElement<any> | null;
}

export class ContactGrid extends React.PureComponent<DispatchProps & StateProps & { children?: React.ReactNode}> {
    public render() {
        const itemDimension = getGridCardSize();
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
                                onPress={() => this.props.onPressFeed(item)}
                                size={itemDimension}
                                defaultImage={defaultImages.defaultUser}
                                modelHelper={modelHelper}
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
