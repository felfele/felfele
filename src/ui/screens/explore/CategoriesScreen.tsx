import * as React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors, ComponentColors } from '../../../styles';
import { RegularText } from '../../misc/text';
import { Category } from '../../../models/recommendation/NewsSource';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../misc/RowButton';
import { TypedNavigation } from '../../../helpers/navigation';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { FragmentSafeAreaView } from '../../misc/FragmentSafeAreaView';

const CATEGORIES_LABEL = 'CATEGORIES';

export interface StateProps {
    categories: Category[];
    navigation: TypedNavigation;
}

export interface DispatchProps { }

export const CategoriesScreen = (props: StateProps & DispatchProps) => {
    const categories = props.categories.map((category: Category) => {
        return (
            <RowItem
                key={category.name}
                title={category.name}
                buttonStyle='navigate'
                onPress={() => {
                    props.navigation.navigate('SubCategoriesContainer', {
                        title: category.name,
                        subCategories: category.subCategories,
                    });
                }}
            />
        );
    });
    return (
        <FragmentSafeAreaView>
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
        </FragmentSafeAreaView>
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
