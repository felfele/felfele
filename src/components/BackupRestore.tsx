import * as React from 'react';
import {
    View,
    StyleSheet,
} from 'react-native';
import { NavigationHeader } from './NavigationHeader';
import { Button } from './Button';
import { TypedNavigation } from '../helpers/navigation';
import { ComponentColors } from '../styles';
import { FragmentSafeAreaViewForTabBar } from '../ui/misc/FragmentSafeAreaView';

export interface StateProps {
    navigation: TypedNavigation;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export const BackupRestore = (props: Props) => (
    <FragmentSafeAreaViewForTabBar style={styles.mainContainer}>
        <NavigationHeader
            title='Backup & Restore'
            navigation={props.navigation}
        />
        <View style={styles.buttonContainer}>
            <Button text='Backup' onPress={() => props.navigation.navigate('Backup', {})} />
            <Button text='Restore' onPress={() => props.navigation.navigate('Restore', {})} />
        </View>
    </FragmentSafeAreaViewForTabBar>
);

const styles = StyleSheet.create({
    mainContainer: {
        height: '100%',
        flexDirection: 'column',
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
});
