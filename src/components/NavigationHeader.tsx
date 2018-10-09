import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../styles';
import { TouchableView } from './TouchableView';

export interface StateProps {
    leftButtonText?: string;
    rightButtonText?: string;
    title?: string;
}

export interface DispatchProps {
    onPressLeftButton?: () => void;
    onPressRightButton?: () => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
}

export class NavigationHeader extends React.Component<Props, State> {
    public render() {
        return (
            <View style={styles.headerContainer}>
                <TouchableView onPress={this.props.onPressLeftButton}>
                    <Text style={styles.headerLeftButtonText}>
                        {this.props.leftButtonText ? this.props.leftButtonText : 'Back'}
                    </Text>
                </TouchableView>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>
                        {this.props.title ? this.props.title : ''}
                    </Text>
                </View>
                <TouchableView onPress={this.props.onPressRightButton}>
                    <Text style={styles.headerRightButtonText}>
                        {this.props.rightButtonText ? this.props.rightButtonText : ''}
                    </Text>
                </TouchableView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        height: 80,
        top: 0,
        left: 0,
        padding: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 30,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.LIGHT_GRAY,
        backgroundColor: Colors.VERY_LIGHT_GRAY,
    },
    headerLeftButtonText: {
        color: Colors.DEFAULT_ACTION_COLOR,
        fontSize: 18,
    },
    titleContainer: {
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.DARK_GRAY,
    },
    headerRightButtonText: {
        color: Colors.DEFAULT_ACTION_COLOR,
        fontSize: 18,
    },
});
