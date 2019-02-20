import * as React from 'react';
import { Debug } from '../Debug';
import { RegularText } from '../ui/misc/text';

export class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
    public static getDerivedStateFromError(error: any) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public state = { hasError: false };

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        Debug.log(error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return <RegularText style={{}}>Something went wrong.</RegularText>;
        }
        return this.props.children;
    }
}
