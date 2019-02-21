import * as React from 'react';
import {
    TextInput,
    TextStyle,
    StyleProp,
    ReturnKeyTypeOptions,
    TextInputProps,
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
    clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
    editable?: boolean;
    value?: string;

    onSubmitEditing?: (text: string) => void;
    onChangeText?: (text: string) => void;
    onEndEditing?: () => void;
}

export class SimpleTextInput extends React.Component<SimpleTextInputProps, { text: string }> {
    public state = {
        text: this.props.value
            ? this.props.value
            : '',
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
                defaultValue={this.props.defaultValue}
                onSubmitEditing={this.onSubmitEditing}
                selectTextOnFocus={this.props.selectTextOnFocus}
                value={this.props.value}
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
                onEndEditing={this.props.onEndEditing ? this.props.onEndEditing : this.onSubmitEditing}
                clearButtonMode={this.props.clearButtonMode}
                editable={this.props.editable}
            />
        );
    }

    private onSubmitEditing = () => {
        if (this.props.onSubmitEditing != null) {
            this.props.onSubmitEditing(this.state.text.trim());
        }
    }
}
