import * as React from 'react';
import { SimpleTextInput } from './SimpleTextInput';
import {
    KeyboardAvoidingView,
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
    Button,
    Image,
} from 'react-native';
import { Author } from '../models/Post';
import { AsyncImagePicker } from '../AsyncImagePicker';
import DefaultStyle from './DefaultStyle';

export interface DispatchProps {
    onUpdateAuthor: (text: string) => void;
    onUpdatePicture: (path: string) => void;
}

export interface StateProps {
    author: Author;
    navigation: any;
}

const tooltip = 'The name to author your posts';
const namePlaceholder = 'Space Cowboy';

export const IdentitySettings = (props: DispatchProps & StateProps) => {
    return (
        <KeyboardAvoidingView>
            <Header onPressBack={() => { props.navigation.goBack(); }} />
            <Text style={styles.tooltip}>{tooltip}</Text>
            <SimpleTextInput
                style={styles.row}
                defaultValue={props.author.name}
                onChangeText={props.onUpdateAuthor}
                placeholder={namePlaceholder}
                autoCapitalize='none'
                autoFocus={props.author.name === ''}
                autoCorrect={false}
            />
            <Text style={styles.tooltip}>Avatar</Text>
            <View style={styles.imagePicker}>
                {props.author.faviconUri &&
                <Image source={{uri: props.author.faviconUri}} style={DefaultStyle.favicon} />}
                <Button
                    title='Pick Image'
                    onPress={async () => {
                        await openImagePicker(props.onUpdatePicture);
                    }}
                />
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

const Header = (props: { onPressBack: () => void }): React.ReactElement<{}> => {
    return (
        <View style={styles.headerContainer}>
            <View style={{ paddingLeft: 15 }}>
                <TouchableOpacity
                    onPress={props.onPressBack}
                    activeOpacity={1.0}
                    hitSlop={{
                        top: 10,
                        left: 10,
                        bottom: 10,
                        right: 10,
                    }}
                >
                <Text style={{ color: '#007AFF' }}>
                    Back
                </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        height: 50,
        top: 0,
        left: 0,
        padding: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    row: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: 'gray',
        fontSize: 16,
    },
    tooltip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    imagePicker: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
});
