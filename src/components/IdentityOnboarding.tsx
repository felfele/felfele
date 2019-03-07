import * as React from 'react';
import { SimpleTextInput } from './SimpleTextInput';
import {
    KeyboardAvoidingView,
    StyleSheet,
    View,
    Image,
    Dimensions,
} from 'react-native';
import { Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { AsyncImagePicker } from '../AsyncImagePicker';
import { Colors } from '../styles';
import { DispatchProps } from './IdentitySettings';
import { TouchableView } from './TouchableView';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// tslint:disable-next-line:no-var-requires
const defaultUserImage = require('../../images/user_circle-white.png');
import { Debug } from '../Debug';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';

const namePlaceholder = 'Space Cowboy';

export { DispatchProps };
export interface StateProps {
    author: Author;
    gatewayAddress: string;
}

export const IdentityOnboarding = (props: DispatchProps & StateProps) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const authorImageUri = modelHelper.getAuthorImageUri(props.author);
    Debug.log('IdentityOnboarding: ', authorImageUri);
    return (
        <KeyboardAvoidingView style={styles.mainContainer}>
            <View style={styles.imagePicker}>
                <TouchableView
                    onPress={async () => {
                        await openImagePicker(props.onUpdatePicture);
                    }}
                >
                    <Image
                        source={authorImageUri === ''
                        ? defaultUserImage
                        : { uri: authorImageUri }
                        }
                        style={styles.faviconPicker}
                    />
                </TouchableView>
            </View>
            <View style={styles.textInputContainer}>
                <SimpleTextInput
                    style={styles.textInput}
                    defaultValue={props.author.name === '' ? namePlaceholder : props.author.name}
                    autoCapitalize='none'
                    autoFocus={false}
                    autoCorrect={false}
                    selectTextOnFocus={true}
                    returnKeyType={'done'}
                    onSubmitEditing={props.onUpdateAuthor}
                />
            </View>
        </KeyboardAvoidingView>
    );
};

const openImagePicker = async (onUpdatePicture: (image: ImageData) => void) => {
    const imageData = await AsyncImagePicker.launchImageLibrary();
    if (imageData != null) {
        onUpdatePicture(imageData);
    }
};

const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
    mainContainer: {
        width: WIDTH,
        height: WIDTH,
    },
    textInput: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: Colors.WHITE,
        fontSize: 20,
        fontStyle: 'italic',
        alignItems: 'center',
        textAlign: 'center',
    },
    textInputContainer: {
        marginHorizontal: 40,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'darkgrey',
        borderRadius: 20,
        backgroundColor: Colors.BRAND_PURPLE,
    },
    tooltip: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 2,
        color: 'white',
        textAlign: 'center',
    },
    imagePicker: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    faviconPicker: {
        borderRadius : 6,
        width: 0.6 * WIDTH,
        height: 0.6 * WIDTH,
        marginVertical: 10,
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        margin: 0,
    },
});
