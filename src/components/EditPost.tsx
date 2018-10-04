import * as React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Keyboard,
    Button,
    Platform,
    ActivityIndicator,
    Alert,
    AlertIOS,
} from 'react-native';
import { AsyncImagePicker } from '../AsyncImagePicker';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { ImagePreviewGrid } from './ImagePreviewGrid';
import { ImageData, Post } from '../models/Post';
import { SimpleTextInput } from './SimpleTextInput';

interface PostScreenNavigationActions {
    cancel?: () => void;
    post?: () => void;
}

const navigationActions: PostScreenNavigationActions = {
    cancel: undefined,
    post: undefined,
};

export interface StateProps {
    navigation: any;
    draft: Post | null;
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
    keyboardHeight: number;
    post: Post;
}

export class EditPost extends React.Component<Props, State> {
    public static navigationOptions = {
        header: undefined,
        title: 'Update status',
        headerLeft: <Button testID='EditPost/CancelButton' title='Cancel' onPress={() => navigationActions.cancel!()} />,
        headerRight: <Button testID='EditPost/PostButton' title='Post' onPress={() => navigationActions.post!()} />,
    };

    public state: State;

    private keyboardDidShowListener;
    private keyboardWillShowListener;
    private keyboardDidHideListener;

    constructor(props) {
        super(props);
        this.state = {
            isKeyboardVisible: false,
            isLoading: false,
            paddingBottom: 0,
            keyboardHeight: 0,
            post: this.getPostFromDraft(this.props.draft),
        };
        navigationActions.cancel = this.onCancelConfirmation;
        navigationActions.post = this.onPressSubmit;
    }

    public onKeyboardDidShow = (e) => {
        console.log('onKeyboardDidShow', this.state.keyboardHeight);

        if (Platform.OS === 'android') {
            this.onKeyboardWillShow(e);
        }

        this.setState({
            isKeyboardVisible: true,
        });
    }

    public onKeyboardWillShow = (e) => {
        const extraKeyboardHeight = 15;
        const baseKeyboardHeight = e.endCoordinates ? e.endCoordinates.height : e.end.height;
        this.setState({
            keyboardHeight: baseKeyboardHeight + extraKeyboardHeight,
        });

        console.log('onKeyboardWillShow', this.state.keyboardHeight);
    }

    public onKeyboardDidHide = () => {
        console.log('onKeyboardDidHide');
        this.setState({
            isKeyboardVisible: false,
            keyboardHeight: 0,
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
            <View
                style={{flexDirection: 'column', paddingBottom: this.state.keyboardHeight, flex: 1, height: '100%', backgroundColor: 'white'}}
            >
                <View style={{flex: 14, flexDirection: 'column'}}>
                    <SimpleTextInput
                        style={{
                            marginTop: 0,
                            flex: 3,
                            fontSize: 16,
                            padding: 10,
                            paddingVertical: 10,
                            textAlignVertical: 'top',
                        }}
                        multiline={true}
                        numberOfLines={4}
                        onChangeText={this.onChangeText}
                        defaultValue={this.state.post.text}
                        placeholder="What's your story?"
                        placeholderTextColor='gray'
                        underlineColorAndroid='transparent'
                        autoFocus={true}
                        testID='EditPost/TextInput'
                    />
                    <ImagePreviewGrid
                        columns={4}
                        images={this.state.post.images}
                        onRemoveImage={this.onRemoveImage}
                        height={100}
                    />
                </View>
                <View style={{
                    flexDirection: 'row',
                    borderTopWidth: 1,
                    borderTopColor: 'lightgray',
                    padding: 5,
                    margin: 0,
                    height: 30,
                }}>
                    {this.renderActionButton(this.openImagePicker, 'Photos/videos', 'md-photos', '#808080', true)}
                </View>
            </View>
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
            text,
        };
        this.setState({
            post,
        });
    }

    private getPostFromDraft = (draft: Post | null): Post => {
        if (draft != null) {
            return draft;
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

        console.log(this.state.post);

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
            { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
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
        console.log('onCancelConfirmation', this.state.isKeyboardVisible);
        this.hideKeyboard();
        console.log('Cancel');
        if (this.state.post.text !== '' || this.state.post.images.length > 0) {
            this.showCancelConfirmation();
        } else {
            this.onCancel();
        }
    }

    private openImagePicker = async () => {
        const imageData = await AsyncImagePicker.launchImageLibrary();
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
        });

        console.log(this.state.post);
        this.props.onPost(this.state.post);
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
