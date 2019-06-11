import * as React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors, ComponentColors } from '../../../styles';
import { RegularText } from '../../misc/text';
import { CategoryMap } from '../../../models/recommendation/NewsSource';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../buttons/RowButton';
import { TypedNavigation } from '../../../helpers/navigation';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { Feed } from '@felfele/felfele-core';

const CATEGORIES_LABEL = 'CATEGORIES';

export interface StateProps {
    categories: CategoryMap<Feed>;
    navigation: TypedNavigation;
}

export interface DispatchProps { }

export const CategoriesScreen = (props: StateProps & DispatchProps) => {
    const categories = Object.keys(props.categories).map((categoryName: string) => {
        return (
            <RowItem
                key={categoryName}
                title={categoryName}
                buttonStyle='navigate'
                onPress={() => {
                    props.navigation.navigate('SubCategoriesContainer', {
                        title: categoryName,
                        subCategories: props.categories[categoryName],
                    });
                }}
            />
        );
    });
    return (
        <FragmentSafeAreaViewWithoutTabBar>
            <SafeAreaView style={{flex: 1}}>
                <NavigationHeader navigation={props.navigation} title='Explore'/>
                <ScrollView style={{ backgroundColor: ComponentColors.BACKGROUND_COLOR }}>
                    <RegularText style={styles.label}>
                        {CATEGORIES_LABEL}
                    </RegularText>
                    {categories}
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
        color: Colors.GRAY,
    },
});
