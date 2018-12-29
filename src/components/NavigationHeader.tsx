import * as React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Colors, DefaultNavigationBarHeight } from '../styles';
import { TouchableView, TouchableViewDefaultHitSlop } from './TouchableView';
import { StatusBarView } from './StatusBarView';

export interface StateProps {
    leftButtonText?: string;
    rightButtonText1?: string | React.ReactNode;
    rightButtonText2?: string | React.ReactNode;
    title?: string;
    hasStatusBar?: boolean;
}

export interface DispatchProps {
    onPressLeftButton?: () => void;
    onPressRightButton1?: () => void;
    onPressRightButton2?: () => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
}

const BACK_ICON_NAME = Platform.OS === 'ios' ? 'ios-arrow-back' : 'md-arrow-back';
const BUTTON_COLOR = Platform.OS === 'ios' ? Colors.DEFAULT_ACTION_COLOR : Colors.DARK_GRAY;
export class NavigationHeader extends React.Component<Props, State> {
    public render() {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <View style={styles.headerContainer}>
                    <TouchableView onPress={this.props.onPressLeftButton} style={styles.leftContainer}>
                        <Text style={styles.headerLeftButtonText}>
                            {
                                this.props.leftButtonText
                                ? this.props.leftButtonText
                                : <Ionicons name={BACK_ICON_NAME} color={BUTTON_COLOR} size={24} />
                            }
                        </Text>
                    </TouchableView>
                    <View style={styles.middleContainer}>
                        <Text
                            style={styles.titleText}
                            ellipsizeMode='tail'
                            numberOfLines={1}
                        >
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
            </SafeAreaView>
        );
    }
}

const RightButton = (props: { onPress?: () => void, text?: string | React.ReactNode }) => {
    return (
        <TouchableView
            onPress={props.onPress}
            testId={'NavigationHeader/RightButton'}
            style={styles.rightButtonContainer}
            hitSlop={{...TouchableViewDefaultHitSlop, left: 0}}
        >
            <Text style={styles.headerRightButtonText}>
                {props.text ? props.text : ''}
            </Text>
        </TouchableView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        width: '100%',
        flexDirection: 'column',
        backgroundColor: Colors.BACKGROUND_COLOR,
    },
    headerContainer: {
        width: '100%',
        height: DefaultNavigationBarHeight,
        top: 0,
        left: 0,
        padding: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 10,
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: Colors.LIGHT_GRAY,
        backgroundColor: Colors.BACKGROUND_COLOR,
    },
    headerLeftButtonText: {
        color: BUTTON_COLOR,
        fontSize: 18,
    },
    leftContainer: {
        flex: 1,
    },
    middleContainer: {
        maxWidth: '50%',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    titleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.DARK_GRAY,
        textAlign: 'center',
    },
    headerRightButtonText: {
        fontSize: 18,
        color: BUTTON_COLOR,
    },
    rightButtonContainer: {
        paddingLeft: 20,
    },
});
