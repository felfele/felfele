import * as React from 'react';
import {
    TextInput,
    View,
    Text,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Keyboard,
    Button,
    Platform,
    ActivityIndicator,
    StyleSheet,
    Alert,
    AlertIOS,
    CameraRoll,
} from 'react-native';
import { AsyncImagePicker } from '../AsyncImagePicker';
import { NavigationActions } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { ImagePreviewGrid } from './ImagePreviewGrid';

import StateTracker from '../StateTracker';
import { Post, ImageData } from '../models/Post';
import { LocalPostManager } from '../LocalPostManager';
import { Debug } from '../Debug';

interface PostScreenNavigationActions {
    cancel?: () => Promise<void>;
    post?: () => Promise<void>;
}

const navigationActions: PostScreenNavigationActions = {
    cancel: undefined,
    post: undefined,
};

export class PostScreen extends React.Component<any, any> {
    public static navigationOptions = {
        header: undefined,
        title: 'Update status',
        headerLeft: <Button title='Cancel' onPress={() => navigationActions.cancel!()} />,
        headerRight: <Button title='Post' onPress={() => navigationActions.post!()} />,
    };

    private keyboardDidShowListener;
    private keyboardWillShowListener;
    private keyboardDidHideListener;

    constructor(props) {
        super(props);
        this.state = {
            text: '',
            uploadedImages: [],
            isKeyboardVisible: false,
            isLoading: true,
            paddingBottom: 0,
            keyboardHeight: 0,
        };
        navigationActions.cancel = () => this.onCancelConfirmation();
        navigationActions.post = () => this.onPressSubmit();

        this.getPostForEditing().then(post => {
            if (post) {
                const [text, images] = LocalPostManager.extractTextAndImagesFromMarkdown(post.text);
                this.setState({
                    text: text,
                    uploadedImages: images,
                    isLoading: false,
                });
            } else {
                this.setState({
                    isLoading: false,
                });
            }
        });
    }

    public onKeyboardDidShow(e) {
        console.log('onKeyboardDidShow', this.state.keyboardHeight);

        if (Platform.OS === 'android') {
            this.onKeyboardWillShow(e);
        }

        this.setState({
            isKeyboardVisible: true,
        });
    }

    public onKeyboardWillShow(e) {
        const extraKeyboardHeight = 15;
        const baseKeyboardHeight = e.endCoordinates ? e.endCoordinates.height : e.end.height;
        this.setState({
            keyboardHeight: baseKeyboardHeight + extraKeyboardHeight,
        });

        console.log('onKeyboardWillShow', this.state.keyboardHeight);
    }

    public onKeyboardDidHide() {
        console.log('onKeyboardDidHide');
        this.setState({
            isKeyboardVisible: false,
            keyboardHeight: 0,
        });
    }

    public componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => this.onKeyboardDidShow(e));
        this.keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => this.onKeyboardWillShow(e));
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => this.onKeyboardDidHide());
    }

    public unregisterListeners() {
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

    public componentDidlUnmount() {
        this.unregisterListeners();
    }

    public render() {
        if (this.state.isLoading) {
            return this.renderActivityIndicator();
        }

        const minHeight = this.state.uploadedImages.length > 0 ? 100 : 0;
        const showText = !this.state.isKeyboardVisible;
        const iconDirection = showText ? 'column' : 'row';
        return (
            <View
                style={{flexDirection: 'column', paddingBottom: this.state.keyboardHeight, flex: 1, height: '100%', backgroundColor: 'white'}}
            >
                    <View style={{flex: 14, flexDirection: 'column'}}>
                        <TextInput
                            style={{marginTop: 0, flex: 3, fontSize: 16, padding: 10, paddingVertical: 10}}
                            multiline={true}
                            numberOfLines={4}
                            onEndEditing={() => {this.hideKeyboard(); }}
                            onChangeText={(text) => this.setState({text})}
                            value={this.state.text}
                            placeholder="What's on your mind?"
                            placeholderTextColor='gray'
                        >
                        </TextInput>
                        <ImagePreviewGrid columns={4} style={{flex: 1, width: '100%', minHeight: minHeight}} images={this.state.uploadedImages} />
                    </View>
                    <View style={{flex: 2, flexDirection: iconDirection, borderTopWidth: 1, borderTopColor: 'lightgray', padding: 5}}>
                        {this.renderActionButton(this.openImagePicker, 'Photos/videos', 'md-photos', '#32A850', showText)}
                        {this.renderActionButton(this.openLocationPicker, 'Location', 'md-locate', '#d53333', showText)}
                    </View>
            </View>
        );
    }

    private async getPostForEditing(): Promise<Post | null> {
        if (this.props.navigation.state.params.post != null) {
            return this.props.navigation.state.params.post;
        }
        return await LocalPostManager.loadDraft();
    }

    private onCancel() {
        this.hideKeyboard();
        this.unregisterListeners();
        this.props.navigation.goBack();
    }

    private hideKeyboard() {
        if (this.state.isKeyboardVisible) {
            Keyboard.dismiss();
            this.setState({
                isKeyboardVisible: false,
            });
        }
    }

    private showCancelConfirmation() {
        const options: any[] = [
            { text: 'Save', onPress: async () => await this.onSave() },
            { text: 'Discard', onPress: async () => await this.onDiscard() },
            { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        ];

        if (Platform.OS === 'ios') {
            AlertIOS.alert(
                'Save this post as a draft?',
                undefined,
                options
            );
        }
        else {
            Alert.alert('Save this post as a draft?',
                undefined,
                options,
                { cancelable: true }
            );
        }
    }

    private async onDiscard() {
        await LocalPostManager.deleteDraft();
        this.onCancel();
    }

    private async onSave() {
        this.setState({
           isLoading: true,
        });

        console.log(this.state.text, this.state.uploadedImages.length);

        const post: Post = {
            images: this.state.uploadedImages,
            text: this.state.text,
            createdAt: Date.now(),
        };

        try {
            await LocalPostManager.saveDraft(post);
            Debug.log('Draft saved', post._id);
        } catch (e) {
            Alert.alert(
                'Error',
                'Saving draft failed, try again later!',
                [
                    {text: 'OK', onPress: () => console.log('OK pressed')},
                ]
            );
        }

        this.onCancel();
    }

    private async onCancelConfirmation() {
        console.log('onCancelConfirmation', this.state.isKeyboardVisible);
        this.hideKeyboard();
        await new Promise(resolve => setTimeout(resolve, 0));
        console.log('Cancel');
        if (this.state.text !== '' || this.state.uploadedImages.length > 0) {
            this.showCancelConfirmation();
        } else {
            this.onCancel();
        }
    }

    private openImagePicker = async () => {
        const pickerResult = await AsyncImagePicker.launchImageLibrary({
            allowsEditing: false,
            aspect: [4, 3],
            base64: true,
            exif: true,
        });
        if (!pickerResult.didCancel) {
            const data: ImageData = {
                uri: pickerResult.uri,
                width: pickerResult.width,
                height: pickerResult.height,
                data: pickerResult.data,
            };

            this.setState({
                uploadedImages: this.state.uploadedImages.concat([data]),
            });
        }
    }

    private openLocationPicker = async () => {
        this.props.navigation.navigate('Location');
    }

    private async onPressSubmit() {
        if (this.state.isLoading) {
            return;
        }

        await this.sendUpdate();
        this.onCancel();
    }

    private async sendUpdate() {
        this.setState({
           isLoading: true,
        });

        console.log(this.state.text, this.state.uploadedImages.length);

        const post: Post = {
            images: this.state.uploadedImages,
            text: this.state.text,
            createdAt: Date.now(),
        };

        try {
            await LocalPostManager.deleteDraft();
            await LocalPostManager.saveAndSyncPost(post);
            Debug.log('Post saved and synced, ', post._id);
        } catch (e) {
            Alert.alert(
                'Error',
                'Posting failed, try again later!',
                [
                    {text: 'OK', onPress: () => console.log('OK pressed')},
                ]
            );
        }
    }

    private markdownEscape(text) {
        return text;
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

    private renderActionButton(onPress, text, iconName, color, showText) {
        const iconSize = showText ? 20 : 30;
        const justifyContent = showText ? 'center' : 'space-around';
        return (
                <TouchableOpacity onPress={onPress} style={{margin: 0, padding: 0, flex: 1, justifyContent: justifyContent}}>
                    <View style={{flex: 1, flexDirection: 'row', margin: 0, padding: 0, alignItems: 'center', justifyContent: justifyContent}}>
                        <View style={{flex: 1, justifyContent: 'center'}}><Ionicons name={iconName} size={iconSize} color={color} /></View>
                        { showText &&
                            <Text style={{fontSize: 14, flex: 10}}>{text}</Text>
                        }
                    </View>
                </TouchableOpacity>
        );
    }
}
