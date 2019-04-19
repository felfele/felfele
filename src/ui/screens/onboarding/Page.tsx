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
    children: ReactNode | ReactNode[];
    leftButton?: ButtonProps;
    rightButton?: ButtonProps;
}

export const Page = (props: Props) => {
    return (
        <FragmentSafeAreaViewForTabBar backgroundColor={Colors.WHITE}>
            <View style={{
                flex: 1,
                backgroundColor: props.backgroundColor,
            }}>
                {props.children}
            </View>
            <View style={styles.buttonRow}>
                {props.leftButton != null &&
                <PageButton
                    label={props.leftButton.label}
                    color={Colors.DARK_GRAY}
                    onPress={props.leftButton.onPress}
                />
                }
                {props.rightButton != null &&
                <PageButton
                    label={props.rightButton.label}
                    color={Colors.BRAND_PURPLE}
                    onPress={props.rightButton.onPress}
                />
                }
            </View>
        </FragmentSafeAreaViewForTabBar>

    );
};

const PageButton = (props: { label: string | ReactNode, color: string, onPress?: () => void}) => (
    <TouchableWithoutFeedback>
        <View style={styles.button}>
            <MediumText
                style={{
                    fontSize: 12,
                    color: props.color,
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
        flex: 0.5,
    },
});
