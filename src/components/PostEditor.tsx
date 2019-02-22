import * as React from 'react';
import {
    View,
    TouchableOpacity,
    Keyboard,
    Platform,
    ActivityIndicator,
    Alert,
    AlertIOS,
    EmitterSubscription,
    SafeAreaView,
    KeyboardAvoidingView,
    StyleSheet,
} from 'react-native';
import { AsyncImagePicker } from '../AsyncImagePicker';

import { ImagePreviewGrid } from './ImagePreviewGrid';
import { Post } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { SimpleTextInput } from './SimpleTextInput';
import { NavigationHeader } from './NavigationHeader';
import { Debug } from '../Debug';
import { markdownEscape, markdownUnescape } from '../markdown';
import { Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface StateProps {
    navigation: any;
    draft: Post | null;
    name: string;
    avatar: ImageData;
}

export interface DispatchProps {
    onPost: (post: Post) => void;
    onSaveDraft: (draft: Post) => void;
    onDeleteDraft: () => void;
}

type Props = StateProps & DispatchProps;

interface State {
    isKeyboardVisible: boolean;
    isLoading: boolean;
    paddingBottom: number;
    post: Post;
}

export class PostEditor extends React.Component<Props, State> {
    public state: State;

    private keyboardDidShowListener: EmitterSubscription | null = null;
    private keyboardWillShowListener: EmitterSubscription | null = null;
    private keyboardDidHideListener: EmitterSubscription | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            isKeyboardVisible: false,
            isLoading: false,
            paddingBottom: 0,
            post: this.getPostFromDraft(this.props.draft),
        };
    }

    public onKeyboardDidShow = (e: any) => {
        Debug.log('onKeyboardDidShow');

        this.setState({
            isKeyboardVisible: true,
        });
    }

    public onKeyboardWillShow = (e: any) => {
        Debug.log('onKeyboardWillShow');
    }

    public onKeyboardDidHide = () => {
        Debug.log('onKeyboardDidHide');
        this.setState({
            isKeyboardVisible: false,
        });
    }

    public componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.onKeyboardDidShow);
        this.keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', this.onKeyboardWillShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.onKeyboardDidHide);
    }

    public unregisterListeners = () => {
        if (this.keyboardDidShowListener) {
            this.keyboardDidShowListener.remove();
            this.keyboardDidShowListener = null;
        }
        if (this.keyboardWillShowListener) {
            this.keyboardWillShowListener.remove();
            this.keyboardWillShowListener = null;
        }
        if (this.keyboardDidHideListener) {
            this.keyboardDidHideListener.remove();
            this.keyboardDidHideListener = null;
        }
    }

    public componentWillUnmount() {
        this.unregisterListeners();
    }

    public render() {
        if (this.state.isLoading) {
            return this.renderActivityIndicator();
        }

        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior='padding'
                    style={styles.container}
                >
                    <NavigationHeader
                        withoutSafeArea={true}
                        leftButtonText={
                            <Icon
                                name={'close'}
                                size={20}
                                color={Colors.DARK_GRAY}
                            />
                        }
                        onPressLeftButton={this.onCancelConfirmation}
                        rightButtonText1={
                            <Icon
                                name={'send'}
                                size={20}
                                color={Colors.BRAND_PURPLE}
                            />
                        }
                        onPressRightButton1={this.onPressSubmit}
                        title={this.props.name}
                    />
                    <SimpleTextInput
                        style={styles.textInput}
                        multiline={true}
                        numberOfLines={4}
                        onChangeText={this.onChangeText}
                        defaultValue={this.state.post.text}
                        placeholder="What's up?"
                        placeholderTextColor='gray'
                        underlineColorAndroid='transparent'
                        autoFocus={true}
                        testID='PostEditor/TextInput'
                    />
                    <ImagePreviewGrid
                        columns={4}
                        images={this.state.post.images}
                        onRemoveImage={this.onRemoveImage}
                        height={100}
                    />
                    <PhotoWidget onPressCamera={this.openCamera} onPressInsert={this.openImagePicker}/>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    private onRemoveImage = (removedImage: ImageData) => {
        const images = this.state.post.images.filter(image => image != null && image.uri !== removedImage.uri);
        const post = {
            ...this.state.post,
            images,
        };
        this.setState({
            post,
        });
    }

    private onChangeText = (text: string) => {
        const post: Post = {
            ...this.state.post,
            text: text,
        };
        this.setState({
            post,
        });
    }

    private getPostFromDraft = (draft: Post | null): Post => {
        if (draft != null) {
            return {
                ...draft,
                text: markdownUnescape(draft.text),
            };
        } else {
            return {
                images: [],
                text: '',
                createdAt: Date.now(),
            };
        }
    }

    private onDiscard = () => {
        this.props.onDeleteDraft();
        this.onCancel();
    }

    private onSave = () => {
        this.setState({
           isLoading: true,
        });

        Debug.log(this.state.post);

        this.props.onSaveDraft(this.state.post);
        this.onCancel();
    }

    private onCancel = () => {
        this.hideKeyboard();
        this.unregisterListeners();
        this.props.navigation.goBack();
    }

    private hideKeyboard = () => {
        if (this.state.isKeyboardVisible) {
            Keyboard.dismiss();
            this.setState({
                isKeyboardVisible: false,
            });
        }
    }

    private showCancelConfirmation = () => {
        const options: any[] = [
            { text: 'Save', onPress: () => this.onSave() },
            { text: 'Discard', onPress: () => this.onDiscard() },
            { text: 'Cancel', onPress: () => Debug.log('Cancel Pressed'), style: 'cancel' },
        ];

        if (Platform.OS === 'ios') {
            AlertIOS.alert(
                'Save this post as a draft?',
                undefined,
                options,
            );
        }
        else {
            Alert.alert('Save this post as a draft?',
                undefined,
                options,
                { cancelable: true },
            );
        }
    }

    private onCancelConfirmation = () => {
        Debug.log('onCancelConfirmation', this.state.isKeyboardVisible);
        this.hideKeyboard();
        Debug.log('Cancel');
        if (this.state.post.text !== '' || this.state.post.images.length > 0) {
            this.showCancelConfirmation();
        } else {
            this.onCancel();
        }
    }

    private openCamera = async () => {
        const imageData = await AsyncImagePicker.launchCamera();
        this.updateStateWithImageData(imageData);
    }

    private openImagePicker = async () => {
        const imageData = await AsyncImagePicker.launchImageLibrary();
        this.updateStateWithImageData(imageData);
    }

    private updateStateWithImageData = (imageData: ImageData | null) => {
        if (imageData != null) {
            const images = this.state.post.images.concat([imageData]);
            const post = {
                ...this.state.post,
                images,
            };
            this.setState({
                post,
            });
        }
    }

    private onPressSubmit = () => {
        if (this.state.isLoading) {
            return;
        }

        this.sendUpdate();
        this.onCancel();
    }

    private sendUpdate = () => {
        this.setState({
           isLoading: true,
           post: {
            ...this.state.post,
            text: markdownEscape(this.state.post.text),
           },
        }, () => {
            Debug.log(this.state.post);
            this.props.onPost(this.state.post);
        });
    }

    private renderActivityIndicator() {
        return (
            <View
                style={{
                    flexDirection: 'column',
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    width: '100%',
                }}
            >
                <ActivityIndicator style={{width: '100%', height: 120, flex: 5}} />
            </View>
        );
    }
}

const PhotoWidget = React.memo((props: { onPressCamera: () => void, onPressInsert: () => void }) => {
    return (
        <View style={styles.photoWidget}
        >
            <TouchableOpacity onPress={props.onPressCamera}>
                <Icon
                    name={'camera'}
                    size={24}
                    color={Colors.DARK_GRAY}
                />
            </TouchableOpacity>
            <TouchableOpacity onPress={props.onPressInsert}>
                <Icon
                    name={'image-multiple'}
                    size={24}
                    color={Colors.DARK_GRAY}
                />
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        padding: 10,
        paddingVertical: 10,
        textAlignVertical: 'top',
    },
    photoWidget: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'lightgray',
        height: 50,
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
    },
});
