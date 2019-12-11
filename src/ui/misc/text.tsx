import * as React from 'react';
import {
    Text,
    StyleSheet,
    TextProps,
} from 'react-native';
import { defaultRegularFont, defaultBoldFont, defaultMediumFont, defaultItalicFont } from '../../styles';
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

export const ItalicText = (props: TextProps & ChildrenProps) => {
    const { style, ...rest } = props;
    return (
        <Text style={[styles.italicFont, style]} {...rest}/>
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
    italicFont: {
        fontFamily: defaultItalicFont,
    },
});
