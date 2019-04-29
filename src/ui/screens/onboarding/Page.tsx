import * as React from 'react';
import { FragmentSafeAreaViewForTabBar } from '../../../ui/misc/FragmentSafeAreaView';
import { ReactNode } from 'react-redux';
import {
    View,
    TouchableWithoutFeedback,
    StyleSheet,
} from 'react-native';
import {
    DefaultTabBarHeight,
    Colors,
} from '../../../styles';
import { MediumText } from '../../../ui/misc/text';
import { ButtonProps } from '../../../components/NavigationHeader';

interface Props {
    backgroundColor: string;
    safeAreaTopBackgroundColor?: string;
    children: ReactNode | ReactNode[];
    leftButton?: PageButtonProps;
    rightButton?: PageButtonProps;
}

export const Page = (props: Props) => {
    return (
        <FragmentSafeAreaViewForTabBar
            topBackgroundColor={props.safeAreaTopBackgroundColor}
            bottomBackgroundColor={Colors.WHITE}
        >
            <View style={{
                flex: 1,
                backgroundColor: props.backgroundColor,
            }}>
                {props.children}
            </View>
            <View style={styles.buttonRow}>
                {props.leftButton != null &&
                <PageButton
                    {...props.leftButton}
                    color={Colors.DARK_GRAY}
                />
                }
                {props.rightButton != null &&
                <PageButton
                    {...props.rightButton}
                    color={Colors.BRAND_PURPLE}
                />
                }
            </View>
        </FragmentSafeAreaViewForTabBar>

    );
};

interface PageButtonProps extends ButtonProps {
    color?: string;
    alignItems: 'center' | 'flex-start' | 'flex-end';
}

const PageButton = (props: PageButtonProps) => (
    <TouchableWithoutFeedback
        disabled={props.disabled}
        onPress={props.onPress}
    >
        <View style={[styles.button, { alignItems: props.alignItems }]}>
            <MediumText
                style={{
                    fontSize: 12,
                    color: props.color,
                    opacity: props.disabled ? 0.5 : 1,
                }}
            >
                {props.label}
            </MediumText>
        </View>
    </TouchableWithoutFeedback>
);

const styles = StyleSheet.create({
    buttonRow: {
        height: DefaultTabBarHeight,
        backgroundColor: Colors.WHITE,
        alignSelf: 'flex-end',
        flexDirection: 'row',
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 10,
        paddingLeft: 18,
        flex: 0.5,
    },
});
