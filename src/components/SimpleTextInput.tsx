import * as React from 'react';
import {
    TextInput,
    TextStyle,
    StyleProp,
    ReturnKeyTypeOptions,
} from 'react-native';

interface SimpleTextInputProps {
    style: StyleProp<TextStyle>;
    placeholder?: string;
    placeholderTextColor?: string;
    autoFocus?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words';
    autoCorrect?: boolean;
    selectTextOnFocus?: boolean;
    numberOfLines?: number;
    multiline?: boolean;
    defaultValue?: string;
    underlineColorAndroid?: string;
    testID?: string;
    returnKeyType?: ReturnKeyTypeOptions;

    onSubmitEditing?: (text: string) => void;
    onChangeText?: (text: string) => void;
}

export class SimpleTextInput extends React.Component<SimpleTextInputProps, { text: string }> {
    public state = {
        text: this.props.defaultValue ? this.props.defaultValue : '',
    };

    public render() {
        return (
            <TextInput
                style={this.props.style}
                onChangeText={(text) => {
                    this.setState({text});
                    if (this.props.onChangeText != null) {
                        this.props.onChangeText(text);
                    }
                }}
                onSubmitEditing={(event) => {
                    if (this.props.onSubmitEditing != null) {
                        this.props.onSubmitEditing(this.state.text.trim());
                    }
                }}
                selectTextOnFocus={this.props.selectTextOnFocus}
                value={this.state.text}
                placeholder={this.props.placeholder}
                placeholderTextColor={this.props.placeholderTextColor}
                autoFocus={this.props.autoFocus}
                autoCapitalize={this.props.autoCapitalize}
                autoCorrect={this.props.autoCorrect}
                multiline={this.props.multiline}
                numberOfLines={this.props.numberOfLines}
                underlineColorAndroid={
                    this.props.underlineColorAndroid != null
                    ? this.props.underlineColorAndroid
                    : 'transparent'
                }
                returnKeyType={this.props.returnKeyType}
                testID={this.props.testID}
            />
        );
    }
}
