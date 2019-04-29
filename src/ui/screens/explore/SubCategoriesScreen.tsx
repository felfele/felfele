import * as React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { ComponentColors } from '../../../styles';
import { RegularText } from '../../misc/text';
import { SubCategoryMap } from '../../../models/recommendation/NewsSource';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../buttons/RowButton';
import { TypedNavigation } from '../../../helpers/navigation';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { FragmentSafeAreaViewWithoutTabBar} from '../../misc/FragmentSafeAreaView';
import { Feed } from '../../../models/Feed';

const SUBCATEGORIES_LABEL = 'SUBCATEGORIES';

export interface StateProps {
    subCategories: SubCategoryMap<Feed>;
    navigation: TypedNavigation;
    title: string;
}

export interface OwnProps {
    navigation: TypedNavigation;
}

export interface DispatchProps { }

export const SubCategoriesScreen = (props: StateProps & DispatchProps) => {
    const subCategories = Object.keys(props.subCategories).map((subCategoryName) => {
        return (
            <RowItem
                key={subCategoryName}
                title={subCategoryName}
                buttonStyle='navigate'
                onPress={() => props.navigation.navigate('NewsSourceGridContainer', {
                    feeds: props.subCategories[subCategoryName],
                    subCategoryName,
                })}
            />
        );
    });
    return (
        <FragmentSafeAreaViewWithoutTabBar>
            <SafeAreaView style={{flex: 1}}>
                <NavigationHeader title={props.title} navigation={props.navigation}/>
                <ScrollView style={{ backgroundColor: ComponentColors.BACKGROUND_COLOR }}>
                    <RegularText style={styles.label}>
                        {SUBCATEGORIES_LABEL}
                    </RegularText>
                    {subCategories}
                </ScrollView>
                <TabBarPlaceholder color={ComponentColors.BACKGROUND_COLOR}/>
            </SafeAreaView>
        </FragmentSafeAreaViewWithoutTabBar>
    );
};

const styles = StyleSheet.create({
    label: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: ComponentColors.TEXT_COLOR,
    },
});
