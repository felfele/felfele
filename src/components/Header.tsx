import * as React from 'react';
import {
    StyleSheet,
    View,
    Text,
} from 'react-native';
import { TouchableView } from './TouchableView';

export const Header = (props: { onPressBack: () => void }): React.ReactElement<{}> => {
    return (
        <View style={styles.headerContainer}>
            <TouchableView
                onPress={props.onPressBack}
                activeOpacity={1.0}
            >
                <Text style={styles.backButton}>
                    Back
                </Text>
            </TouchableView>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        height: 55,
        paddingLeft: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        color: '#007AFF',
        fontSize: 16,
    },
});
