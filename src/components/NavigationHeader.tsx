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
                <TouchableView onPress={this.props.onPressLeftButton} style={styles.leftContainer}>
                    <Text style={styles.headerLeftButtonText}>
                        {this.props.leftButtonText ? this.props.leftButtonText : 'Back'}
                    </Text>
                </TouchableView>
                <View style={styles.middleContainer}>
                    <Text style={styles.titleText}>
                        {this.props.title ? this.props.title : ''}
                    </Text>
                </View>
                <TouchableView
                    onPress={this.props.onPressRightButton}
                    style={styles.rightContainer}
                    testId={'NavigationHeader/RightButton'}
                >
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
        height: 70,
        top: 0,
        left: 0,
        padding: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 30,
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: Colors.LIGHT_GRAY,
        backgroundColor: Colors.VERY_LIGHT_GRAY,
    },
    headerLeftButtonText: {
        color: Colors.DEFAULT_ACTION_COLOR,
        fontSize: 18,
    },
    leftContainer: {
        flex: 1,
    },
    middleContainer: {
        flex: 1,
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.DARK_GRAY,
        textAlign: 'center',
    },
    headerRightButtonText: {
        fontSize: 18,
        color: Colors.DEFAULT_ACTION_COLOR,
    },
});
