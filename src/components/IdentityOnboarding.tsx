import * as React from 'react';
import { SimpleTextInput } from './SimpleTextInput';
import {
    KeyboardAvoidingView,
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
} from 'react-native';
import { Author } from '../models/Post';
import { ImageData } from '../models/ImageData';
import { AsyncImagePicker } from '../AsyncImagePicker';
import { Colors } from '../styles';
import { DispatchProps } from './IdentitySettings';

// tslint:disable-next-line:no-var-requires
const defaultUserImage = require('../../images/user_circle.png');
import { Debug } from '../Debug';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';

const tooltip = 'Name';
const namePlaceholder = 'Space Cowboy';
const modelHelper = new ReactNativeModelHelper();

export { DispatchProps };
export interface StateProps {
    author: Author;
}

export const IdentityOnboarding = (props: DispatchProps & StateProps) => {
    const authorImageUri = modelHelper.getAuthorImageUri(props.author);
    Debug.log('IdentityOnboarding: ', authorImageUri);
    return (
        <KeyboardAvoidingView>
            <Text style={styles.tooltip}>{tooltip}</Text>
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
            <Text style={styles.tooltip}>Avatar</Text>
            <View style={styles.imagePicker}>
                <TouchableOpacity
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
                </TouchableOpacity>
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

const styles = StyleSheet.create({
    textInput: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: Colors.LIGHT_GRAY,
        fontSize: 16,
        alignItems: 'center',
    },
    textInputContainer: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'darkgrey',
        borderRadius: 20,
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
        width: 64,
        height: 64,
        marginVertical: 10,
    },
});
