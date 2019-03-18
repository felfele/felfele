import * as React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '../../../styles';
import { RegularText } from '../../misc/text';
import { SubCategory } from '../../../models/recommendation/NewsSource';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../misc/RowButton';

const SUBCATEGORIES_LABEL = 'SUBCATEGORIES';

export interface StateProps {
    subCategories: SubCategory[];
    navigation: any;
    title: string;
}

export interface OwnProps {
    navigation: any;
}

export interface DispatchProps { }

export const SubCategoriesScreen = (props: StateProps & DispatchProps) => {
    const subCategories = props.subCategories.map((subCategory: SubCategory) => {
        return (
            <RowItem
                key={subCategory.name}
                title={subCategory.name}
                buttonStyle='navigate'
                onPress={() => props.navigation.navigate('NewsSourceGridContainer', {
                    newsSources: subCategory.list,
                    subCategoryName: subCategory.name,
                })}
            />
        );
    });
    return (
        <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
            <NavigationHeader title={props.title} onPressLeftButton={() => props.navigation.goBack()}/>
            <ScrollView style={{ backgroundColor: Colors.BACKGROUND_COLOR }}>
                <RegularText style={styles.label}>
                    {SUBCATEGORIES_LABEL}
                </RegularText>
                {subCategories}
            </ScrollView>
        </SafeAreaView>
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
