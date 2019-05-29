import * as React from 'react';
import {
    View,
    KeyboardAvoidingView,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';

import { NavigationHeader } from './NavigationHeader';
import { SimpleTextInput } from './SimpleTextInput';
import { Colors, ComponentColors } from '../styles';
import { TypedNavigation } from '../helpers/navigation';

export interface StateProps {
    swarmGatewayAddress: string;
    navigation: TypedNavigation;
}

export interface DispatchProps {
    onChangeSwarmGatewayAddress: (address: string) => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export const SwarmSettings = (props: Props) => (
    <SafeAreaView style={styles.mainContainer}>
        <KeyboardAvoidingView style={styles.container}>
            <NavigationHeader
                navigation={props.navigation}
                title={'Swarm settings'}
            />
            <Text style={styles.tooltip}>Swarm gateway address</Text>
            <SimpleTextInput
                style={styles.row}
                defaultValue={props.swarmGatewayAddress}
                placeholder={'https://swarm-gateways.net'}
                autoCapitalize='none'
                autoFocus={true}
                autoCorrect={false}
                selectTextOnFocus={true}
                returnKeyType={'done'}
                onSubmitEditing={props.onChangeSwarmGatewayAddress}
                onEndEditing={() => {}}
            />
        </KeyboardAvoidingView>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    mainContainer: {
        height: '100%',
        backgroundColor: ComponentColors.HEADER_COLOR,
    },
    container: {
        height: '100%',
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
    },
    row: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: Colors.DARK_GRAY,
        fontSize: 16,
    },
    tooltip: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 2,
        color: Colors.GRAY,
    },
});
