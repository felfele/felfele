import * as React from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    Alert,
    AlertIOS,
    KeyboardAvoidingView,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { AsyncImagePicker } from '../AsyncImagePicker';

import { ImagePreviewGrid, GRID_SPACING } from './ImagePreviewGrid';
import { Post } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { SimpleTextInput } from './SimpleTextInput';
import { NavigationHeader } from './NavigationHeader';
import { Debug } from '../Debug';
import { markdownEscape, markdownUnescape } from '../markdown';
import { ComponentColors, Colors } from '../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Avatar } from '../ui/misc/Avatar';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { ModelHelper } from '../models/ModelHelper';
import { TouchableViewDefaultHitSlop } from './TouchableView';
import { TypedNavigation } from '../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../ui/misc/FragmentSafeAreaView';
import { fetchHtmlMetaData } from '../helpers/htmlMetaData';
import { convertPostToParentPost, convertHtmlMetaDataToPost } from '../helpers/postHelpers';
import { getHttpLinkFromText } from '../helpers/urlUtils';

export interface StateProps {
    navigation: TypedNavigation;
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
    isSending: boolean;
}

export class PostEditor extends React.Component<Props, State> {
    public state: State;
    private modelHelper: ModelHelper;
    private textInput: SimpleTextInput | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            post: this.getPostFromDraft(this.props.draft),
            isSending: false,
        };
        this.modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
    }

    public render() {
        const isPostEmpty = this.isPostEmpty();
        const isSendEnabled = !isPostEmpty && !this.state.isSending;
        const sendIconColor = isSendEnabled ? ComponentColors.NAVIGATION_BUTTON_COLOR : ComponentColors.HEADER_COLOR;
        const sendIcon = this.state.isSending
            ? <ActivityIndicator size='small' color={ComponentColors.NAVIGATION_BUTTON_COLOR} />
            : <Icon name='send' size={20} color={sendIconColor} />
        ;
        const sendButtonOnPress = isSendEnabled ? this.onPressSubmit : () => {};
        const windowWidth = Dimensions.get('window').width;

        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <NavigationHeader
                    leftButton={{
                        onPress: this.onCancelConfirmation,
                        label: <Icon
                            name={'close'}
                            size={20}
                            color={ComponentColors.NAVIGATION_BUTTON_COLOR}
                        />,
                        testID: 'PostEditor/CloseButton',
                    }}
                    rightButton1={{
                        onPress: sendButtonOnPress,
                        label: sendIcon,
                        testID: 'PostEditor/SendPostButton',
                    }}
                    titleImage={
                        <Avatar
                            size='medium'
                            style={{ marginRight: 10 }}
                            image={this.props.avatar}
                            modelHelper={this.modelHelper}
                        />
                    }
                    title={this.props.name}
                />
                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior='padding'
                    style={styles.container}
                >
                    <ImagePreviewGrid
                        images={this.state.post.images}
                        imageSize={Math.floor((windowWidth - GRID_SPACING * 4) / 3)}
                        onRemoveImage={this.onRemoveImage}
                        modelHelper={this.modelHelper}
                        onReleaseRow={(_, order: number[]) => {
                            this.setState({
                                post: {
                                    ...this.state.post,
                                    images: order.map(i => this.state.post.images[i]),
                                },
                            });
                            this.focusTextInput();
                        }}
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
                        blurOnSubmit={false}
                        testID='PostEditor/TextInput'
                        ref={ref => this.textInput = ref}
                    />
                    <PhotoWidget onPressCamera={this.openCamera} onPressInsert={this.openImagePicker}/>
                </KeyboardAvoidingView>
            </FragmentSafeAreaViewWithoutTabBar>
        );
    }

    private isPostEmpty = () => {
        return this.state.post.text === '' && this.state.post.images.length === 0;
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
        this.focusTextInput();
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
        this.focusTextInput();
    }

    private focusTextInput = () => {
        if (this.textInput != null) {
            this.textInput.focus();
        }
    }

    private onPressSubmit = async () => {
        await this.sendUpdate();
        this.props.navigation.goBack();
    }

    private createPostFromState = async (): Promise<Post> => {
        const httpLink = getHttpLinkFromText(this.state.post.text);

        if (httpLink != null) {
            const url = httpLink;
            const htmlMetaData = await fetchHtmlMetaData(url);
            const post = convertPostToParentPost(convertHtmlMetaDataToPost({
                ...htmlMetaData,
                description: '',
            }));
            return {
                ...post,
                createdAt: this.state.post.createdAt,
                updatedAt: this.state.post.createdAt,
            };
        } else {
            const markdownText = markdownEscape(this.state.post.text);
            const post = {
                ...this.state.post,
                text: markdownText,
            };
            return post;
        }
    }

    private sendUpdate = async () => {
        this.setState({
            isSending: true,
        });
        const post = await this.createPostFromState();
        this.props.onPost(post);
    }
}

const PhotoWidget = React.memo((props: { onPressCamera: () => void, onPressInsert: () => void }) => {
    return (
        <View style={styles.photoWidget}
        >
            <TouchableOpacity
                onPress={props.onPressCamera}
                hitSlop={TouchableViewDefaultHitSlop}
            >
                <Icon
                    name={'camera'}
                    size={24}
                    color={ComponentColors.BUTTON_COLOR}
                />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={props.onPressInsert}
                hitSlop={TouchableViewDefaultHitSlop}
            >
                <Icon
                    name={'image-multiple'}
                    size={24}
                    color={ComponentColors.BUTTON_COLOR}
                />
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        flex: 1,
        flexDirection: 'column',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        margin: 10,
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
