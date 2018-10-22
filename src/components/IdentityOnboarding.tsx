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
import { AsyncImagePicker } from '../AsyncImagePicker';
import { Colors, DefaultStyle } from '../styles';
// @ts-ignore
const image = require('../../images/user_circle.png');

export interface DispatchProps {
    onUpdateAuthor: (text: string) => void;
    onUpdatePicture: (path: string) => void;
}

export interface StateProps {
    author: Author;
    navigation: any;
}

const tooltip = 'Name';
const namePlaceholder = 'Space Cowboy';

export const IdentityOnboarding = (props: DispatchProps & StateProps) => {
    if (props.author.name === '') {
        props.onUpdateAuthor(namePlaceholder);
    }
    return (
        <KeyboardAvoidingView>
            <Text style={styles.tooltip}>{tooltip}</Text>
            <SimpleTextInput
                style={styles.row}
                defaultValue={props.author.name === '' ? namePlaceholder : props.author.name}
                onChangeText={props.onUpdateAuthor}
                autoCapitalize='none'
                autoFocus={false}
                autoCorrect={false}
            />
            <Text style={styles.tooltip}>Avatar</Text>
            <View style={styles.imagePicker}>
                <TouchableOpacity
                    onPress={async () => {
                        await openImagePicker(props.onUpdatePicture);
                    }}
                >
                    <Image
                        source={props.author.faviconUri === ''
                        ? image
                        : { uri: props.author.faviconUri }
                        }
                        style={styles.faviconPicker}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const openImagePicker = async (onUpdatePicture: (path: string) => void) => {
    const imageData = await AsyncImagePicker.launchImageLibrary();
    if (imageData != null) {
        onUpdatePicture(imageData.uri);
    }
};

const styles = StyleSheet.create({
    row: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: Colors.LIGHT_GRAY,
        fontSize: 16,
        alignItems: 'center',
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
