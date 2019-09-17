import * as React from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    Alert,
    KeyboardAvoidingView,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Keyboard,
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
import { TOUCHABLE_VIEW_DEFAULT_HIT_SLOP } from './TouchableView';
import { FragmentSafeAreaViewWithoutTabBar } from '../ui/misc/FragmentSafeAreaView';
import { fetchHtmlMetaData } from '../helpers/htmlMetaData';
import { convertPostToParentPost, convertHtmlMetaDataToPost, createPostWithLinkMetaData } from '../helpers/postHelpers';
import { getHttpLinkFromText } from '../helpers/urlUtils';
import { Utils } from '../Utils';
import { TypedNavigation } from '../helpers/navigation';
import { NavigationEvents } from 'react-navigation';

export interface StateProps {
    goBack: () => boolean;
    draft: Post | null;
    name: string;
    avatar: ImageData;
    gatewayAddress: string;
    dismiss?: () => void;
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
    private textInput: SimpleTextInput | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            post: this.getPostFromDraft(this.props.draft),
        };
        this.modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
    }

    public render() {
        const isPostEmpty = this.isPostEmpty();
        const isSendEnabled = !isPostEmpty;
        const sendIconColor = isSendEnabled ? ComponentColors.NAVIGATION_BUTTON_COLOR : ComponentColors.HEADER_COLOR;
        const sendIcon = <Icon name='send' size={20} color={sendIconColor} />;
        const sendButtonOnPress = isSendEnabled ? this.onPressSubmit : () => {};
        const windowWidth = Dimensions.get('window').width;

        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <NavigationEvents
                    onWillFocus={this.onWilFocus}
                />
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
                    <PhotoWidget
                        onPressCamera={this.openCamera}
                        onPressInsert={this.openImagePicker}
                    />
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
        this.props.goBack();
    }

    private onSave = () => {
        Debug.log(this.state.post);
        this.props.onSaveDraft(this.state.post);
        this.props.goBack();
    }

    private showCancelConfirmation = async () => {
        await this.waitUntilKeyboardDisappears();

        const options: any[] = [
            { text: 'Save', onPress: () => this.onSave() },
            { text: 'Discard', onPress: () => this.onDiscard() },
            { text: 'Cancel', onPress: () => this.focusTextInput(), style: 'cancel' },
        ];

        Alert.alert('Save this post as a draft?',
            undefined,
            options,
            { cancelable: true },
        );
    }

    private waitUntilKeyboardDisappears = async () => {
        // This is a hack to avoid the keyboard to appear again before discarding the post
        // It is necessary because on iOS the alert window remembers the state of the
        // keyboard and restores it after the alert window is closed.
        //
        // In the case of 'Discard' this looked bad if the keyboard was visible when the
        // alert was called, so we have to dismiss the keyboard. However it has an animation
        // and if the keyboard is somewhat visible, alert will restore it anyhow. Hence the
        // `waitMillisec` function to wait until it disappears completely.
        Keyboard.dismiss();
        await Utils.waitMillisec(50);
    }

    private onCancelConfirmation = () => {
        Debug.log('Cancel');
        if (this.props.dismiss || (this.state.post.text === '' && this.state.post.images.length === 0)) {
            this.props.dismiss != null ? this.props.dismiss() : this.props.goBack();
        } else {
            this.showCancelConfirmation();
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

    private onWilFocus = () => {
        this.focusTextInput();
    }

    private onPressSubmit = async () => {
        await this.sendUpdate();
    }

    private sendUpdate = async () => {
        const post = await createPostWithLinkMetaData(this.state.post);
        this.props.onPost(post);
    }
}

const PhotoWidget = React.memo((props: { onPressCamera: () => void, onPressInsert: () => void }) => {
    return (
        <View style={styles.photoWidget}
        >
            <TouchableOpacity
                onPress={props.onPressCamera}
                hitSlop={TOUCHABLE_VIEW_DEFAULT_HIT_SLOP}
            >
                <Icon
                    name={'camera'}
                    size={24}
                    color={Colors.BLACK}
                />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={props.onPressInsert}
                hitSlop={TOUCHABLE_VIEW_DEFAULT_HIT_SLOP}
            >
                <Icon
                    name={'image-multiple'}
                    size={24}
                    color={Colors.BLACK}
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
        fontSize: 18,
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
