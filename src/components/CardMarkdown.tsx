import * as React from 'react';
import { StyleSheet, View } from 'react-native';

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
        marginBottom: 10,
        marginHorizontal: 10,
    },
});
