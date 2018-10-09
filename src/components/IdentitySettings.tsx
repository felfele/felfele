import * as React from 'react';
import { SimpleTextInput } from './SimpleTextInput';
import {
    KeyboardAvoidingView,
    StyleSheet,
    View,
    Text,
    Button,
    Image,
} from 'react-native';
import { Author } from '../models/Post';
import { AsyncImagePicker } from '../AsyncImagePicker';
import { Colors, DefaultStyle } from '../styles';
import { TouchableView } from './TouchableView';
import { NavigationHeader } from './NavigationHeader';

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
            <NavigationHeader
                onPressLeftButton={() => { props.navigation.goBack(); }}
            />
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
            <TouchableView onPress={props.onPressBack}>
                <Text style={styles.headerBackButton}>
                    Back
                </Text>
            </TouchableView>
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
        paddingLeft: 10,
        paddingTop: 30,
        marginBottom: 10,
    },
    headerBackButton: {
        color: Colors.DEFAULT_ACTION_COLOR,
        fontSize: 18,
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
        color: Colors.DARK_GRAY,
        fontSize: 16,
    },
    tooltip: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 2,
        color: Colors.GRAY,
    },
    imagePicker: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
});
