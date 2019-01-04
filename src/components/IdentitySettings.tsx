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
} from 'react-native';

import { SimpleTextInput } from './SimpleTextInput';
import { Author, getAuthorImageUri } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { AsyncImagePicker } from '../AsyncImagePicker';
import { Colors } from '../styles';
import { NavigationHeader } from './NavigationHeader';
// @ts-ignore
const defaultUserImage = require('../../images/user_circle.png');
import { Feed } from '../models/Feed';
import { Debug } from '../Debug';

export interface DispatchProps {
    onUpdateAuthor: (text: string) => void;
    onUpdatePicture: (image: ImageData) => void;
}

export interface StateProps {
    author: Author;
    ownFeed?: Feed;
    navigation: any;
}

const tooltip = 'The name to author your posts';
const namePlaceholder = 'Space Cowboy';
const screenTitle = 'Identity';

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
    const authorImageUri = getAuthorImageUri(props.author);
    Debug.log('IdentitySettings: ', qrCodeValue);
    return (
        <KeyboardAvoidingView>
            <NavigationHeader
                onPressLeftButton={() => {
                    // null is needed otherwise it does not work with switchnavigator backbehavior property
                    props.navigation.goBack(null);
                }}
                rightButtonText1={props.ownFeed != null ? 'Share' : undefined}
                onPressRightButton1={async () => showShareDialog(props.ownFeed)}
                title={screenTitle}
            />
            <Text style={styles.tooltip}>{tooltip}</Text>
            <SimpleTextInput
                style={styles.row}
                defaultValue={props.author.name}
                placeholder={namePlaceholder}
                autoCapitalize='none'
                autoFocus={props.author.name === ''}
                autoCorrect={false}
                selectTextOnFocus={true}
                returnKeyType={'done'}
                onSubmitEditing={props.onUpdateAuthor}
                />
            <Text style={styles.tooltip}>Avatar</Text>
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
        </KeyboardAvoidingView>
    );
};

const openImagePicker = async (onUpdatePicture: (imageData: ImageData) => void) => {
    const imageData = await AsyncImagePicker.launchImageLibrary();
    if (imageData != null) {
        onUpdatePicture(imageData);
    }
};

const styles = StyleSheet.create({
    row: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: Colors.DARK_GRAY,
        fontSize: 16,
    },
    tooltip: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 2,
        color: Colors.GRAY,
    },
    imagePickerContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    imagePicker: {
        borderRadius : 6,
        width: 64,
        height: 64,
        marginVertical: 10,
    },
    qrCodeContainer: {
        marginTop: 10,
        width: QRCodeWidth,
        height: QRCodeWidth,
        padding: 0,
        alignSelf: 'center',
    },
});
