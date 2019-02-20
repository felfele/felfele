import * as React from 'react';
import {
    Text,
    StyleSheet,
    TextProps,
} from 'react-native';

export const BoldText = (props: TextProps) => {
    const { style, ...rest } = props;
    return (
        <Text style={[styles.boldFont, style]} {...rest}/>
    );
};

export const MediumText = (props: TextProps) => {
    const { style, ...rest } = props;
    return (
        <Text style={[styles.mediumFont, style]} {...rest}/>
    );
};

export const RegularText = (props: TextProps) => {
    const { style, ...rest } = props;
    return (
        <Text style={[styles.regularFont, style]} {...rest}/>
    );
};

const styles = StyleSheet.create({
    boldFont: {
        fontFamily: 'Roboto-Bold',
    },
    regularFont: {
        fontFamily: 'Roboto-Regular',
    },
    mediumFont: {
        fontFamily: 'Roboto-Medium',
    },
});
