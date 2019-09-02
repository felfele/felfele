import * as React from 'react';
import { ChildrenProps } from './ChildrenProps';
import { View, StyleSheet } from 'react-native';
import { BoldText, RegularText } from './text';
import { Colors } from '../../styles';

interface Props extends ChildrenProps {
    title?: string;
    topic?: string;
    explanation?: string;
}

export const IllustrationWithExplanation = (props: Props) => {
    return (
        <View style={styles.container}>
            {props.children}
            <BoldText style={styles.title}>{props.title}</BoldText>
            <RegularText style={styles.topic}>{props.topic}</RegularText>
            <RegularText style={styles.explanation}>{props.explanation}</RegularText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    title: {
        fontSize: 18,
        color: Colors.BLACK,
        textAlign: 'center',
        paddingTop: 20,
    },
    topic: {
        fontSize: 18,
        color: Colors.BLACK,
        textAlign: 'center',
        paddingTop: 10,
    },
    explanation: {
        fontSize: 14,
        color: Colors.BLACK,
        textAlign: 'center',
        paddingTop: 10,
    },
});
