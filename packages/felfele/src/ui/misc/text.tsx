import * as React from 'react';
import {
    Text,
    StyleSheet,
    TextProps,
} from 'react-native';
import { defaultRegularFont, defaultBoldFont, defaultMediumFont } from '../../styles';
import { ChildrenProps } from './ChildrenProps';

export const BoldText = (props: TextProps & ChildrenProps) => {
    const { style, ...rest } = props;
    return (
        <Text style={[styles.boldFont, style]} {...rest}/>
    );
};

export const MediumText = (props: TextProps & ChildrenProps) => {
    const { style, ...rest } = props;
    return (
        <Text style={[styles.mediumFont, style]} {...rest}/>
    );
};

export const RegularText = (props: TextProps & ChildrenProps) => {
    const { style, ...rest } = props;
    return (
        <Text style={[styles.regularFont, style]} {...rest}/>
    );
};

const styles = StyleSheet.create({
    boldFont: {
        fontFamily: defaultBoldFont,
    },
    regularFont: {
        fontFamily: defaultRegularFont,
    },
    mediumFont: {
        fontFamily: defaultMediumFont,
    },
});
