import * as React from 'react';
import { SimpleTextInput } from './SimpleTextInput';
import { KeyboardAvoidingView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Identity } from '../models/Identity';

export interface DispatchProps {
    onUpdateAuthor: (text: string) => void;
    onUpdatePicture: (path: string) => void;
}

export interface StateProps {
    identity: Identity;
    navigation: any;
}

const tooltip = 'The name to author your posts';
const namePlaceholder = 'Space Cowboy';

export const IdentitySettings = (props: DispatchProps & StateProps) => {
    return (
        <KeyboardAvoidingView>
            <Header onPressBack={() => { props.navigation.goBack(); }} />
            <Text style={styles.nameTooltip}>{tooltip}</Text>
            <SimpleTextInput
                style={styles.row}
                defaultValue={props.identity.name}
                onChangeText={props.onUpdateAuthor}
                placeholder={namePlaceholder}
                autoCapitalize='none'
                autoFocus={props.identity.name === ''}
                autoCorrect={false}
            />
        </KeyboardAvoidingView>
    );
};

const Header = (props: { onPressBack: () => void }): React.ReactElement<{}> => {
    return (
        <View style={styles.headerContainer}>
            <View style={{ paddingLeft: 15 }}>
                <TouchableOpacity
                    onPress={() => {
                        props.onPressBack();
                        console.log('back pressed');
                    }}
                    activeOpacity={1.0}
                    hitSlop={{
                        top: 10,
                        left: 10,
                        bottom: 10,
                        right: 10,
                    }}
                >
                <Text style={{ color: '#007AFF' }}>
                    Back
                </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        height: 50,
        top: 0,
        left: 0,
        padding: 0,
        flexDirection: 'row',
        alignItems: 'center',
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
        color: 'gray',
        fontSize: 16,
    },
    nameTooltip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
});
