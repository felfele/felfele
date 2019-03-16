import * as React from 'react';
import QRCode from 'react-native-qrcode-svg';
import {
    KeyboardAvoidingView,
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    Share,
    ShareContent,
    ShareOptions,
    Platform,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { SimpleTextInput } from './SimpleTextInput';
import { Author, DEFAULT_AUTHOR_NAME } from '../models/Author';
import { ImageData } from '../models/ImageData';
import { AsyncImagePicker } from '../AsyncImagePicker';
import { Colors } from '../styles';
import { NavigationHeader } from './NavigationHeader';
// tslint:disable-next-line:no-var-requires
const defaultUserImage = require('../../images/user_circle.png');
import { Feed } from '../models/Feed';
import { Debug } from '../Debug';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { RowItem } from '../ui/misc/RowButton';
import { RegularText } from '../ui/misc/text';
import { TabBarPlaceholder } from '../ui/misc/TabBarPlaceholder';

export interface DispatchProps {
    onUpdateAuthor: (text: string) => void;
    onUpdatePicture: (image: ImageData) => void;
    onChangeText?: (text: string) => void;
}

export interface StateProps {
    author: Author;
    ownFeed?: Feed;
    navigation: any;
    gatewayAddress: string;
}

const NAME_LABEL = 'NAME';
const NAME_PLACEHOLDER = DEFAULT_AUTHOR_NAME;
const SCREEN_TITLE = 'Profile';
const ACTIVITY_LABEL = 'ACTIVITY';
const VIEW_POSTS_LABEL = 'View all your posts';

const QRCodeWidth = Dimensions.get('window').width * 0.6;

const generateQRCodeValue = (feed?: Feed): string => {
    if (feed == null) {
        return '';
    }
    return feed.url;
};

const showShareDialog = async (feed?: Feed) => {
    const url = feed != null ? feed.url : '';
    const title = 'Share your feed';
    const message = Platform.OS === 'android' ? url : undefined;
    const content: ShareContent = {
        url,
        title,
        message,
    };
    const options: ShareOptions = {
    };
    await Share.share(content, options);
};

export const IdentitySettings = (props: DispatchProps & StateProps) => {
    const qrCodeValue = generateQRCodeValue(props.ownFeed);
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const authorImageUri = modelHelper.getAuthorImageUri(props.author);
    Debug.log('IdentitySettings: ', authorImageUri);
    return (
        <SafeAreaView style={styles.safeAreaContainer}>
            <KeyboardAvoidingView style={styles.mainContainer}>
                <NavigationHeader
                    rightButtonText1={props.ownFeed != null
                        ? <MaterialCommunityIcon
                            name={'share'}
                            size={20}
                            color={Colors.DARK_GRAY}
                        />
                        : undefined
                    }
                    onPressRightButton1={async () => showShareDialog(props.ownFeed)}
                    title={SCREEN_TITLE}
                />
                <ScrollView
                    keyboardShouldPersistTaps='handled'
                >
                    <TouchableOpacity
                        onPress={async () => {
                            await openImagePicker(props.onUpdatePicture);
                        }}
                        style={styles.imagePickerContainer}
                    >
                        <Image
                            source={authorImageUri === ''
                                ? defaultUserImage
                                : { uri: authorImageUri }
                            }
                            style={styles.imagePicker}
                        />
                    </TouchableOpacity>
                    <RegularText style={styles.tooltip}>{NAME_LABEL}</RegularText>
                    <SimpleTextInput
                        style={styles.row}
                        defaultValue={props.author.name}
                        placeholder={NAME_PLACEHOLDER}
                        autoCapitalize='none'
                        autoFocus={props.author.name === ''}
                        autoCorrect={false}
                        selectTextOnFocus={true}
                        returnKeyType={'done'}
                        onSubmitEditing={(name) =>
                            name === ''
                            ? props.onUpdateAuthor(NAME_PLACEHOLDER)
                            : props.onUpdateAuthor(name)
                        }
                    />
                    <RegularText style={styles.tooltip}>{ACTIVITY_LABEL}</RegularText>
                    <RowItem
                        title={VIEW_POSTS_LABEL}
                        buttonStyle='navigate'
                        onPress={() => props.navigation.navigate('YourTab')}
                    />
                    { props.ownFeed &&
                        <View style={styles.qrCodeContainer}>
                            <QRCode
                                value={qrCodeValue}
                                size={QRCodeWidth}
                                color={Colors.DARK_GRAY}
                                backgroundColor={Colors.BACKGROUND_COLOR}
                            />
                        </View>
                    }
                </ScrollView>
                <TabBarPlaceholder/>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const openImagePicker = async (onUpdatePicture: (imageData: ImageData) => void) => {
    const imageData = await AsyncImagePicker.launchImageLibrary();
    if (imageData != null) {
        onUpdatePicture(imageData);
    }
};

const styles = StyleSheet.create({
    safeAreaContainer: {
        backgroundColor: Colors.WHITE,
        flex: 1,
    },
    mainContainer: {
        backgroundColor: Colors.BACKGROUND_COLOR,
        flex: 1,
    },
    row: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 10,
        color: Colors.DARK_GRAY,
        fontSize: 14,
    },
    tooltip: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.GRAY,
        fontSize: 12,
    },
    imagePickerContainer: {
        flexDirection: 'row',
        alignSelf: 'center',
    },
    imagePicker: {
        borderRadius : 72.5,
        width: 145,
        height: 145,
        marginVertical: 10,
    },
    qrCodeContainer: {
        marginVertical: 10,
        width: QRCodeWidth,
        height: QRCodeWidth,
        padding: 0,
        alignSelf: 'center',
    },
});
