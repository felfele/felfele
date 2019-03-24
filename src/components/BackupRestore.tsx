import * as React from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { NavigationHeader } from './NavigationHeader';
import { Button } from './Button';
import { TypedNavigation, Routes } from '../helpers/navigation';

export interface StateProps {
    navigation: TypedNavigation;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export const BackupRestore = (props: Props) => (
    <SafeAreaView style={styles.mainContainer}>
        <NavigationHeader
            title='Backup & Restore'
            navigation={props.navigation}
        />
        <View style={styles.buttonContainer}>
            <Button text='Backup' onPress={() => props.navigation.navigate<Routes, 'Backup'>('Backup', {})} />
            <Button text='Restore' onPress={() => props.navigation.navigate<Routes, 'Restore'>('Restore', {})} />
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    mainContainer: {
        height: '100%',
        flexDirection: 'column',
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
});
