import * as React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { SuperGridSectionList } from 'react-native-super-grid';

import { Feed } from '../../../models/Feed';
import { Colors, ComponentColors, DefaultTabBarHeight } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { GridCard, getGridCardSize } from '../../misc/GridCard';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { MediumText } from '../../misc/text';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { defaultImages } from '../../../defaultImages';
import { TypedNavigation } from '../../../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { getFeedImage } from '../../../helpers/feedHelpers';
import { FloatingButton } from '../../misc/FloatingButton';
import SplashScreen from 'react-native-splash-screen';

export interface DispatchProps {
    onPressFeed: (feed: Feed) => void;
    openExplore: () => void;
}

export interface PagesSection {
    title?: string;
    data: Feed[];
}

export interface StateProps {
    navigation: TypedNavigation;
    gatewayAddress: string;
    title: string;
    headerComponent?: React.ComponentType<any> | React.ReactElement<any> | null;
    sections: PagesSection[];
}

class FeedGrid extends React.PureComponent<DispatchProps & StateProps & { children?: React.ReactNode}> {
    public render() {
        const itemDimension = getGridCardSize();
        const modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
        return (
            <SafeAreaView style={{ backgroundColor: ComponentColors.BACKGROUND_COLOR, flex: 1 }}>
                {this.props.children}
                {
                // @ts-ignore - SuperGridSectionList is passing props to internal SectionList, typings is missing
                <SuperGridSectionList
                    style={{ flex: 1, backgroundColor: ComponentColors.BACKGROUND_COLOR }}
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

    public componentDidMount() {
        SplashScreen.hide();
    }
}

export const PagesScreen = (props: DispatchProps & StateProps) => (
    <FragmentSafeAreaViewWithoutTabBar>
        <FeedGrid
            {...props}
        >
            <NavigationHeader
                title={props.title}
            />
        </FeedGrid>
        <FloatingButton
            iconName='plus'
            iconSize={48}
            onPress={() => props.navigation.navigate('CreatePage', {})}
            extraBottom={DefaultTabBarHeight}
        />
    </FragmentSafeAreaViewWithoutTabBar>
);

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
