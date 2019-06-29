import * as React from 'react';
import { Platform, Keyboard, EmitterSubscription } from 'react-native';

export class HideWhenKeyboardShownComponent extends React.Component<{ children: React.ReactNode }> {
    public state = {
        visible: true,
    };

    private keyboardDidShowListener: null | EmitterSubscription = null;
    private keyboardDidHideListener: null | EmitterSubscription = null;

    public componentDidMount() {
        if (Platform.OS === 'android') {
            this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => this.setState({visible: false}));
            this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => this.setState({visible: true}));
        }
    }

    public componentWillUnmount() {
        if (this.keyboardDidShowListener != null) {
            this.keyboardDidShowListener.remove();
        }
        if (this.keyboardDidHideListener != null) {
            this.keyboardDidHideListener.remove();
        }
    }

    public render() {
        if (!this.state.visible) {
            return null;
        } else {
            return this.props.children;
        }
    }
}
