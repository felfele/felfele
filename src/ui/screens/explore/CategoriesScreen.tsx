import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../../styles';
import { RegularText } from '../../misc/text';
import { Category } from '../../../models/recommendation/NewsSource';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../misc/RowButton';

const CATEGORIES_LABEL = 'CATEGORIES';

export interface StateProps {
    categoryMap: { [name: string]: Category };
    navigation: any;
}

export interface DispatchProps { }

export const CategoriesScreen = (props: StateProps & DispatchProps) => {
    const categoryMap = props.categoryMap;
    const categories = Object.keys(categoryMap).map((categoryName: string) => {
        return (
            <RowItem
                key={categoryName}
                title={categoryName}
                buttonStyle='navigate'
                onPress={() => {
                    props.navigation.navigate('SubCategoriesContainer', {
                        title: categoryName,
                        subCategories: categoryMap[categoryName],
                    });
                }}
            />
        );
    });
    return (
        <View style={{ backgroundColor: Colors.BACKGROUND_COLOR, flex: 1 }}>
            <NavigationHeader title='Explore' onPressLeftButton={() => props.navigation.goBack()}/>
            <ScrollView>
                <RegularText style={styles.label}>
                    {CATEGORIES_LABEL}
                </RegularText>
                {categories}
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
