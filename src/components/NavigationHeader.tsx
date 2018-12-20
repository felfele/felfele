import * as React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Colors } from '../styles';
import { TouchableView } from './TouchableView';
import { StatusBarView } from './StatusBarView';

export interface StateProps {
    leftButtonText?: string;
    rightButtonText?: string;
    title?: string;
    hasStatusBar?: boolean;
}

export interface DispatchProps {
    onPressLeftButton?: () => void;
    onPressRightButton?: () => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
}

const BACK_ICON_NAME = Platform.OS === 'ios' ? 'ios-arrow-back' : 'md-arrow-back';
const BACK_BUTTON_TEXT = Platform.OS === 'ios' ? '  Back' : '';
export class NavigationHeader extends React.Component<Props, State> {
    public render() {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <View style={styles.headerContainer}>
                    <TouchableView onPress={this.props.onPressLeftButton} style={styles.leftContainer}>
                        <Text style={styles.headerLeftButtonText}>
                            {this.props.leftButtonText == null && <Ionicons name={BACK_ICON_NAME} color={Colors.DEFAULT_ACTION_COLOR} size={18} />}
                            {this.props.leftButtonText ? this.props.leftButtonText : BACK_BUTTON_TEXT}
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
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        width: '100%',
        flexDirection: 'column',
        backgroundColor: Colors.BACKGROUND_COLOR,
    },
    headerContainer: {
        width: '100%',
        height: 50,
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
        color: Colors.DEFAULT_ACTION_COLOR,
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
