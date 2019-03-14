import * as React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors, DefaultNavigationBarHeight } from '../styles';
import { TouchableView, TouchableViewDefaultHitSlop } from './TouchableView';
import { MediumText, RegularText } from '../ui/misc/text';

export interface StateProps {
    leftButtonText?: string | React.ReactNode;
    rightButtonText1?: string | React.ReactNode;
    rightButtonText2?: string | React.ReactNode;
    titleImage?: React.ReactNode;
    title?: string;
}

export interface DispatchProps {
    onPressLeftButton?: () => void;
    onPressRightButton1?: () => void;
    onPressRightButton2?: () => void;
    onPressTitle?: () => void;
}

export type Props = StateProps & DispatchProps;

export interface State {
}

const BUTTON_COLOR = Colors.DARK_GRAY;

const Header = (props: Props) => (
    <View style={styles.headerContainer}>
        <TouchableView onPress={props.onPressLeftButton} style={styles.leftContainer}>
            <RegularText style={styles.headerLeftButtonText}>
                {
                    props.leftButtonText != null || props.onPressLeftButton == null
                    ? props.leftButtonText
                    : <Icon name={'arrow-left'} color={BUTTON_COLOR} size={24} />
                }
            </RegularText>
        </TouchableView>
        <TouchableView onPress={props.onPressTitle} style={styles.middleContainer}>
            {props.titleImage}
            <MediumText
                style={styles.titleText}
                ellipsizeMode='tail'
                numberOfLines={1}
            >
                {props.title ? props.title : ''}
            </MediumText>
        </TouchableView>
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
        return <Header {...props}/>;
};

const RightButton = (props: { onPress?: () => void, text?: string | React.ReactNode }) => {
    return (
        <TouchableView
            onPress={props.onPress}
            testID={'NavigationHeader/RightButton'}
            style={styles.rightButtonContainer}
            hitSlop={{...TouchableViewDefaultHitSlop, left: 10}}
        >
            <RegularText style={styles.headerRightButtonText}>
                {props.text ? props.text : ''}
            </RegularText>
        </TouchableView>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        height: DefaultNavigationBarHeight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 2,
        borderBottomWidth: 1,
        borderBottomColor: Colors.LIGHT_GRAY,
        backgroundColor: Colors.WHITE,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    titleText: {
        fontSize: 15,
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
