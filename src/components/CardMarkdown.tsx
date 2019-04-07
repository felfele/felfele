import * as React from 'react';
import { TouchableWithoutFeedback, Text, Linking, StyleSheet } from 'react-native';

// @ts-ignore
// import Markdown from 'react-native-easy-markdown';
import Markdown from 'react-native-markdown-renderer';
import { ErrorBoundary } from './ErrorBoundary';

export const CardMarkdown = (props: { text: string }) => (
    <ErrorBoundary>
        <Markdown
            style={styles.markdownStyle}
            // renderLink={(href: string, title: string, children: React.ReactNode) => {
            //     return (
            //         <TouchableWithoutFeedback
            //             key={'linkWrapper_' + href + Date.now()}
            //             onPress={() => Linking.openURL(href).catch(() => { /* nothing */ })}
            //         >
            //             <Text key={'linkWrapper_' + href + Date.now()} style={{textDecorationLine: 'underline'}}>
            //                 {children}
            //             </Text>
            //         </TouchableWithoutFeedback>
            //     );
            // }}
        >{props.text}</Markdown>
    </ErrorBoundary>
);

const styles = StyleSheet.create({
    markdownStyle: {
        marginVertical: 10,
        marginHorizontal: 10,
    },
});
