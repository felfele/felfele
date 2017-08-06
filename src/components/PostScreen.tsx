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
    AlertIOS
} from 'react-native';
import { ImagePicker } from '../ImagePicker';
import { NavigationActions } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { ImagePreviewGrid } from './ImagePreviewGrid';

import { Backend } from '../Backend';
import StateTracker from '../StateTracker';
import { Post, ImageData } from '../models/Post';
import { PostManager } from '../PostManager';
import { Debug } from '../Debug';

var navigationActions = {};

class PostScreen extends React.Component<any, any> {
    keyboardHeight = 0;
    keyboardDidShowListener;
    keyboardWillShowListener;
    keyboardDidHideListener;
    
    constructor(props) {
        super(props);
        this.state = {
            text: '',
            uploadedImages: [],
            isKeyboardVisible: false,
            isUploading: false,
            paddingBottom: 0
        };
        navigationActions['Cancel'] = () => this.onCancelConfirmation();
        navigationActions['Post'] = () => this.onPressSubmit();
    }

    onKeyboardDidShow(e) {
        console.log('onKeyboardDidShow', this.keyboardHeight);

        if (Platform.OS === 'android') {
            this.onKeyboardWillShow(e);
        }

        this.setState({
            isKeyboardVisible: true
        });
    }

    onKeyboardWillShow(e) {
        const extraKeyboardHeight = 15;
        this.keyboardHeight = e.endCoordinates ? e.endCoordinates.height : e.end.height;
        this.keyboardHeight += extraKeyboardHeight;

        console.log('onKeyboardWillShow', this.keyboardHeight);
    }

    onKeyboardDidHide() {
        console.log('onKeyboardDidHide');
        this.keyboardHeight = 0;
        this.setState({isKeyboardVisible: false});
    }

    componentWillMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => this.onKeyboardDidShow(e));
        this.keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => this.onKeyboardWillShow(e));
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => this.onKeyboardDidHide());
    }

    unregisterListeners() {
        if (this.keyboardDidShowListener) {
            this.keyboardDidShowListener.remove();
            this.keyboardDidShowListener = null;
        }
        if (this.keyboardWillShowListener) {
            this.keyboardWillShowListener.remove();
            this.keyboardWillShowListener = null
        }
        if (this.keyboardDidHideListener) {
            this.keyboardDidHideListener.remove();
            this.keyboardDidHideListener = null;
        }

    }

    componentWillUnmount() {
        this.unregisterListeners();
    }

    onCancel() {
        this.hideKeyboard();
        this.unregisterListeners();
        this.props.navigation.goBack();
    }

    hideKeyboard() {
        if (this.state.isKeyboardVisible) {
            Keyboard.dismiss();
            this.setState({
                isKeyboardVisible: false
            });
        }
    }

    showCancelConfirmation() {
        if (Platform.OS === 'ios') {
            AlertIOS.alert(
                'Save this post as a draft?',
                undefined,
                [
                    { text: 'Save', onPress: () => console.log('Save') },
                    { text: 'Discard', onPress: () => this.onCancel() },
                    { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                ],
            )
        }
        else {
            Alert.alert('Save this post as a draft?',
                undefined,
                [
                    { text: 'Save', onPress: () => console.log('Save') },
                    { text: 'Discard', onPress: () => this.onCancel() },
                    { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                ],
                { cancelable: true }
            );
        }
    }

    async onCancelConfirmation() {
        console.log('onCancelConfirmation', this.state.isKeyboardVisible);
        this.hideKeyboard();
        await new Promise(resolve => setTimeout(resolve, 0));
        console.log('Cancel');
        if (this.state.text != '' || this.state.uploadedImages.length > 0) {
            this.showCancelConfirmation();
        } else {
            this.onCancel();
        }
    }

    static navigationOptions = {
        header: undefined,
        title: 'Update status',
        headerLeft: <Button title='Cancel' onPress={() => navigationActions['Cancel']()} />,
        headerRight: <Button title='Post' onPress={() => navigationActions['Post']()} />
    };

    openImagePicker = async () => {
        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: false,
            aspect: [4,3],
            base64: true,
            exif: true,
        });
        if (pickerResult.cancelled == false) {
            const data: ImageData = {
                uri: pickerResult.uri,
                width: pickerResult.width,
                height: pickerResult.height,
                data: pickerResult.base64,
            }

            this.setState({
                uploadedImages: this.state.uploadedImages.concat([data])
            });            
        }
    }

    openLocationPicker = async () => {
        this.props.navigation.navigate('Location');
    }

    async onPressSubmit() {
        if (this.state.isUploading) {
            return;
        }

        await this.sendUpdate();
        this.onCancel();
    }

    async sendUpdate() {
        this.setState({
           isUploading: true 
        });

        console.log(this.state.text, this.state.uploadedImages.length);

        const post: Post = {
            images: this.state.uploadedImages,
            text: this.state.text,
            createdAt: Date.now()
        }

        try {
            await PostManager.saveAndSyncPost(post);
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

    markdownEscape(text) {
        return text;
    }

    renderActivityIndicator() {
        return (
            <View
                style={{ 
                    flexDirection: 'column', 
                    flex: 1, 
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%', 
                    width: '100%'
                }}
            >
                <ActivityIndicator style={{width: '100%', height: 120, flex: 5}} />
            </View>
        );
    }

    renderActionButton(onPress, text, iconName, color, showText) {
        const iconSize = showText ? 20 : 30;
        return (
                <TouchableOpacity onPress={onPress} style={{margin: 0, padding: 0, flex: 1, justifyContent: 'center'}}>
                    <View style={{flex: 1, flexDirection: 'row', margin: 0, padding: 0}}>
                        <View style={{flex: 1}}><Ionicons name={iconName} size={iconSize} color={color} /></View>
                        { showText &&
                            <Text style={{fontSize: 14, flex: 10}}>{text}</Text>
                        }
                    </View>
                </TouchableOpacity>
        );
    }

    render() {
        console.log('render', this.keyboardHeight);
        if (this.state.isUploading) {
            return this.renderActivityIndicator();
        }

        const minHeight = this.state.uploadedImages.length > 0 ? 100 : 0;
        const showText = !this.state.isKeyboardVisible;
        const iconDirection = showText ? 'column' : 'row';
        return (
            <View 
                style={{flexDirection: 'column', paddingBottom: this.keyboardHeight, flex: 1, height: '100%', backgroundColor: 'white'}}
            >
                    <View style={{flex: 14, flexDirection: 'column'}}>
                        <TextInput
                            style={{marginTop: 0, flex: 3, fontSize: 16, padding: 3}}
                            multiline={true} 
                            numberOfLines={4}  
                            onEndEditing={() => {this.hideKeyboard()}}
                            onChangeText={(text) => this.setState({text})}
                            placeholder="What's on your mind?"
                            placeholderTextColor='gray'
                        >
                        </TextInput> 
                        <ImagePreviewGrid columns={4} style={{flex: 1, width: '100%', minHeight: minHeight}} images={this.state.uploadedImages} />
                    </View>
                    <View style={{flex: 2, flexDirection: iconDirection, borderTopWidth: 1, borderTopColor: 'lightgray', padding: 5}}>
                        {this.renderActionButton(this.openImagePicker, 'Photos/videos', 'md-photos', 'green', showText)}
                        {this.renderActionButton(this.openLocationPicker, 'Location', 'md-locate', 'red', showText)}
                    </View>
            </View>            
        )
    }
}

export default PostScreen;