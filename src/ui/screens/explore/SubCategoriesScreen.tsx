import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../../styles';
import { RegularText } from '../../misc/text';
import { SubCategory, Category } from '../../../models/recommendation/NewsSource';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../misc/RowButton';

const SUBCATEGORIES_LABEL = 'SUBCATEGORIES';

export interface StateProps {
    subCategories: Category;
    navigation: any;
    title: string;
}

export interface OwnProps {
    navigation: any;
}

export interface DispatchProps { }

export const SubCategoriesScreen = (props: StateProps & DispatchProps) => {
    const subCategoryMap = props.subCategories;
    const subCategories = Object.keys(subCategoryMap).map((subCategoryName: string) => {
        return (
            <RowItem
                key={subCategoryName}
                title={subCategoryName}
                buttonStyle='navigate'
            />
        );
    });
    return (
        <View style={{ backgroundColor: Colors.BACKGROUND_COLOR, flex: 1 }}>
            <NavigationHeader title={props.title} onPressLeftButton={() => props.navigation.goBack()}/>
            <ScrollView>
                <RegularText style={styles.label}>
                    {SUBCATEGORIES_LABEL}
                </RegularText>
                {subCategories}
            </ScrollView>
        </View>
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
