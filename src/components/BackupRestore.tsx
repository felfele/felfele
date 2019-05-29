import * as React from 'react';
import {
    View,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationHeader } from './NavigationHeader';
import { TypedNavigation } from '../helpers/navigation';
import { FragmentSafeAreaViewForTabBar } from '../ui/misc/FragmentSafeAreaView';
import { TwoButton } from '../ui/buttons/TwoButton';
import { Colors } from '../styles';

export interface StateProps {
    navigation: TypedNavigation;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export const BackupRestore = (props: Props) => (
    <FragmentSafeAreaViewForTabBar>
        <NavigationHeader
            title='Backup & Restore'
            navigation={props.navigation}
        />
        <View style={styles.buttonContainer}>
            <TwoButton
                leftButton={{
                    label: 'Backup',
                    icon: <Icon name='cloud-upload' color={Colors.BRAND_PURPLE} size={24} />,
                    onPress: () => props.navigation.navigate('Backup', {}),
                }}
                rightButton={{
                    label: 'Restore',
                    icon: <Icon name='cloud-download' color={Colors.BRAND_PURPLE} size={24} />,
                    onPress: () => props.navigation.navigate('Restore', {}),
                }}
            />
        </View>
    </FragmentSafeAreaViewForTabBar>
);

const styles = StyleSheet.create({
    buttonContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
});
