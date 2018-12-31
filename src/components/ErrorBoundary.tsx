import * as React from 'react';
import { Text } from 'react-native';

export class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
    public static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public state = { hasError: false };

    public componentDidCatch(error, info) {
        console.log(error, info);
    }

    public render() {
        if (this.state.hasError) {
            return <Text>Something went wrong.</Text>;
        }
        return this.props.children;
    }
}
