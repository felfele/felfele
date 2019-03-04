import * as React from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    Alert,
    AlertIOS,
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
import { Avatar } from '../ui/misc/Avatar';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { ModelHelper } from '../models/ModelHelper';

export interface StateProps {
    navigation: any;
    draft: Post | null;
    name: string;
    avatar: ImageData;
    gatewayAddress: string;
}

export interface DispatchProps {
    onPost: (post: Post) => void;
    onSaveDraft: (draft: Post) => void;
    onDeleteDraft: () => void;
}

type Props = StateProps & DispatchProps;

interface State {
    post: Post;
}

export class PostEditor extends React.Component<Props, State> {
    public state: State;
    private modelHelper: ModelHelper;

    constructor(props: Props) {
        super(props);
        this.state = {
            post: this.getPostFromDraft(this.props.draft),
        };
        this.modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
    }

    public render() {
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
                        titleImage={
                            <Avatar
                                size='medium'
                                style={{ marginRight: 10 }}
                                imageUri={this.modelHelper.getImageUri(this.props.avatar)}
                            />
                        }
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
                        modelHelper={this.modelHelper}
                    />
                    <PhotoWidget onPressCamera={this.openCamera} onPressInsert={this.openImagePicker}/>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    private onRemoveImage = (removedImage: ImageData) => {
        const images = this.state.post.images.filter(image => image.localPath !== removedImage.localPath);
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
        this.props.navigation.goBack();
    }

    private onSave = () => {
        Debug.log(this.state.post);
        this.props.onSaveDraft(this.state.post);
        this.props.navigation.goBack();
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
        Debug.log('Cancel');
        if (this.state.post.text !== '' || this.state.post.images.length > 0) {
            this.showCancelConfirmation();
        } else {
            this.props.navigation.goBack();
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
        this.sendUpdate();
        this.props.navigation.goBack();
    }

    private sendUpdate = () => {
        this.setState({
           post: {
            ...this.state.post,
            text: markdownEscape(this.state.post.text),
           },
        }, () => {
            Debug.log(this.state.post);
            this.props.onPost(this.state.post);
        });
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
