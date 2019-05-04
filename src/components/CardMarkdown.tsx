import * as React from 'react';
import { TouchableWithoutFeedback, Text, Linking, StyleSheet, View } from 'react-native';

// @ts-ignore
import * as EasyMarkdown from 'react-native-easy-markdown';
import * as MarkdownRenderer from 'react-native-markdown-renderer';
import { ErrorBoundary } from './ErrorBoundary';

const CardMarkdownRenderer = (props: { text: string }) => (
    <ErrorBoundary>
        <View style={styles.markdownStyle}>
            <MarkdownRenderer>{props.text}</MarkdownRenderer>
        </View>
    </ErrorBoundary>
);

const CardMarkdownEasy = (props: { text: string }) => {
    let counter = 0;
    return (
        <ErrorBoundary>
            <EasyMarkdown
                style={styles.markdownStyle}
                renderLink={(href: string, title: string, children: React.ReactNode) => {
                    return (
                        <TouchableWithoutFeedback
                            key={'linkWrapper_' + href + counter++}
                            onPress={() => Linking.openURL(href).catch(() => { /* nothing */ })}
                        >
                            <Text key={'linkWrapperText_' + href + counter++} style={{textDecorationLine: 'underline'}}>
                                {children}
                            </Text>
                        </TouchableWithoutFeedback>
                    );
                }}
            >{props.text}</EasyMarkdown>
        </ErrorBoundary>
    );
};

export const CardMarkdown = CardMarkdownEasy;

const styles = StyleSheet.create({
    markdownStyle: {
        marginVertical: 10,
        marginHorizontal: 10,
    },
});
