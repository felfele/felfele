import * as React from 'react';
import { TouchableWithoutFeedback, Text, Linking, StyleSheet, View } from 'react-native';

// @ts-ignore
// import Markdown from 'react-native-easy-markdown';
import Markdown from 'react-native-markdown-renderer';
import { ErrorBoundary } from './ErrorBoundary';

export const CardMarkdown = (props: { text: string }) => (
    <ErrorBoundary>
        <View style={styles.markdownStyle}>
            <Markdown>{props.text}</Markdown>
        </View>
    </ErrorBoundary>
);

const styles = StyleSheet.create({
    markdownStyle: {
        marginVertical: 10,
        marginHorizontal: 10,
    },
});
