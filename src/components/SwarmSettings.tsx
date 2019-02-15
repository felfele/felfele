import * as React from 'react';
import {
    View,
    KeyboardAvoidingView,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import { NavigationHeader } from './NavigationHeader';
import { SimpleTextInput } from './SimpleTextInput';
import { Colors } from '../styles';

export interface StateProps {
    swarmGatewayAddress: string;
    navigation: any;
}

export interface DispatchProps {
    onChangeSwarmGatewayAddress: (address: string) => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export const SwarmSettings = (props: Props) => (
    <KeyboardAvoidingView style={styles.mainContainer}>
        <NavigationHeader
            onPressLeftButton={() => {
                // null is needed otherwise it does not work with switchnavigator backbehavior property
                props.navigation.goBack(null);
            }}
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
);

const styles = StyleSheet.create({
    mainContainer: {
        height: '100%',
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
