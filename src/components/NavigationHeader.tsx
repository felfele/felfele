import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../styles';
import { TouchableView } from './TouchableView';

export interface StateProps {
    leftButtonText?: string;
    rightButtonText1?: string | React.ReactNode;
    rightButtonText2?: string | React.ReactNode;
    title?: string;
}

export interface DispatchProps {
    onPressLeftButton?: () => void;
    onPressRightButton1?: () => void;
    onPressRightButton2?: () => void;
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
                <View style={styles.rightContainer}>
                    {this.props.rightButtonText1 &&
                    <RightButton onPress={this.props.onPressRightButton1} text={this.props.rightButtonText1} />}
                    {this.props.rightButtonText2 &&
                    <RightButton onPress={this.props.onPressRightButton2} text={this.props.rightButtonText2} />}
                </View>
            </View>
        );
    }
}

const RightButton = (props: { onPress?: () => void, text?: string | React.ReactNode }) => {
    return (
        <TouchableView
            onPress={props.onPress}
            testId={'NavigationHeader/RightButton'}
        >
            <Text style={styles.headerRightButtonText}>
                {props.text ? props.text : ''}
            </Text>
        </TouchableView>
    );
};

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
    },
    rightContainer: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
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
