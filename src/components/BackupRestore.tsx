import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationHeader } from './NavigationHeader';
import { Button } from './Button';

export interface StateProps {
    navigation: any;
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
            onPressLeftButton={() => props.navigation.goBack(null)}
        />
        <View style={styles.buttonContainer}>
            <Button text='Backup' onPress={() => props.navigation.navigate('Backup')} />
            <Button text='Restore' onPress={() => props.navigation.navigate('Restore')} />
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
