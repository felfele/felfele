import * as React from 'react';
import { FlatGrid } from 'react-native-super-grid';
import { GridCard, getGridCardSize } from '../../misc/GridCard';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { ComponentColors } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { Feed } from '@felfele/felfele-core';
import { TypedNavigation } from '../../../helpers/navigation';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { getFeedImage } from '../../../helpers/feedHelpers';

export interface StateProps {
    gatewayAddress: string;
    subCategoryName: string;
    feeds: Feed[];
    navigation: TypedNavigation;
}

export interface DispatchProps {
    downloadPostsForNewsSource: (feed: Feed) => void;
}

export const NewsSourceGridScreen = (props: StateProps & DispatchProps) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const itemDimension = getGridCardSize();
    return (
        <FragmentSafeAreaViewWithoutTabBar>
            <NavigationHeader title={props.subCategoryName} navigation={props.navigation}/>
            {props.feeds.length > 0 &&
                <FlatGrid
                    style={{ flex: 1, backgroundColor: ComponentColors.BACKGROUND_COLOR }}
                    spacing={10}
                    fixed={true}
                    itemDimension={itemDimension}
                    items={props.feeds}
                    renderItem={({ item }: any) => {
                        const image = getFeedImage(item);
                        return (
                            <GridCard
                                title={item.name}
                                image={image}
                                onPress={() => {
                                    props.downloadPostsForNewsSource(item);
                                    props.navigation.navigate('NewsSourceFeed', {
                                        feed: item,
                                    });
                                }}
                                modelHelper={modelHelper}
                                size={itemDimension}
                            />
                        );
                    }}
                />
            }
            <TabBarPlaceholder color={ComponentColors.BACKGROUND_COLOR}/>
        </FragmentSafeAreaViewWithoutTabBar>
    );
};
