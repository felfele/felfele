import * as React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Colors, DefaultNavigationBarHeight } from '../styles';
import { TouchableView, TouchableViewDefaultHitSlop } from './TouchableView';

export interface StateProps {
    leftButtonText?: string;
    rightButtonText1?: string | React.ReactNode;
    rightButtonText2?: string | React.ReactNode;
    title?: string;
    withoutSafeArea?: boolean;
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

const Header = (props: Props) => (
    <View style={styles.headerContainer}>
        <TouchableView onPress={props.onPressLeftButton} style={styles.leftContainer}>
            <Text style={styles.headerLeftButtonText}>
                {
                    props.leftButtonText != null
                    ? props.leftButtonText
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
                {props.title ? props.title : ''}
            </Text>
        </View>
        <View style={styles.rightContainer}>
            {props.rightButtonText1 &&
            <RightButton onPress={props.onPressRightButton1} text={props.rightButtonText1} />}
            {props.rightButtonText2 &&
                <View style={{paddingRight: 20}}>
                    <RightButton onPress={props.onPressRightButton2} text={props.rightButtonText2} />
                </View>
            }
        </View>
    </View>
);

export const NavigationHeader = (props: Props) => {
    if (props.withoutSafeArea === true) {
        return <Header {...props} />;
    } else {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <Header {...props} />
            </SafeAreaView>
        );
    }
};

const RightButton = (props: { onPress?: () => void, text?: string | React.ReactNode }) => {
    return (
        <TouchableView
            onPress={props.onPress}
            testId={'NavigationHeader/RightButton'}
            style={styles.rightButtonContainer}
            hitSlop={{...TouchableViewDefaultHitSlop, left: 10}}
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
        paddingTop: 2,
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
        marginLeft: 30,
    },
});
