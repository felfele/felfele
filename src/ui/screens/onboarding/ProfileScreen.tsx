import * as React from 'react';
import { SimpleTextInput } from '../../../components/SimpleTextInput';
import {
    StyleSheet,
    View,
    Dimensions,
    KeyboardAvoidingView,
} from 'react-native';

import { Author } from '../../../models/Author';
import { ImageData } from '../../../models/ImageData';
import { AsyncImagePicker } from '../../../AsyncImagePicker';
import { Colors, ComponentColors } from '../../../styles';
import { DispatchProps as ContactScreenDispatchProps } from '../profile/ContactScreen';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { Page } from './Page';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RegularText } from '../../misc/text';
import { TypedNavigation } from '../../../helpers/navigation';
import { defaultAuthor } from '../../../reducers/defaultData';
import { AvatarPicker } from '../../misc/AvatarPicker';
import { createUserImage } from '../../../defaultUserImage';

export type CreateUserCallback = (
    name: string,
    image: ImageData,
    navigation: TypedNavigation,
) => void;

export interface DispatchProps extends ContactScreenDispatchProps {
    onCreateUser: CreateUserCallback;
}

export interface StateProps {
    author: Author;
    gatewayAddress: string;
    navigation: TypedNavigation;
}

type Props = DispatchProps & StateProps;

interface State {
    image: ImageData;
}

export class ProfileScreen extends React.Component<Props, State> {
    public state: State = {
        image: createUserImage(),
    };

    public render() {
        const modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
        const isFormFilled = this.props.author.name !== '' && this.props.author.name !== defaultAuthor.name;

        return (
            <Page
                backgroundColor={ComponentColors.BACKGROUND_COLOR}
                leftButton={{
                    label: isFormFilled ? 'Looks good!' : '',
                    onPress: () => {},
                    alignItems: 'flex-start',
                }}
                rightButton={{
                    label: 'DONE',
                    disabled: !isFormFilled,
                    onPress: () => onDoneCreatingProfile({
                        ...this.props.author,
                        image: this.state.image,
                    }, this.props.navigation, this.props.onCreateUser),
                    alignItems: 'flex-end',
                }}
            >
                <NavigationHeader
                    title='Your profile'
                    navigation={this.props.navigation}
                />
                <KeyboardAvoidingView behavior='position'>
                    <View style={styles.imagePickerContainer}>
                        <AvatarPicker
                            modelHelper={modelHelper}
                            width={WIDTH}
                            onSelect={this.onUpdateImage}
                            image={this.state.image}
                        />
                    </View>
                    <RegularText style={styles.tooltip}>NAME</RegularText>
                    <SimpleTextInput
                        style={styles.textInput}
                        defaultValue={this.props.author.name}
                        placeholder={'Type your name here'}
                        placeholderTextColor={Colors.GRAY}
                        autoCapitalize='none'
                        autoFocus={false}
                        autoCorrect={false}
                        selectTextOnFocus={true}
                        returnKeyType={'done'}
                        onSubmitEditing={this.props.onUpdateAuthor}
                        onChangeText={this.props.onUpdateAuthor}
                    />
                    <RegularText style={styles.tooltip}>
                        You can change your name and picture anytime.
                    </RegularText>
                </KeyboardAvoidingView>
            </Page>
        );
    }

    private onUpdateImage = (image: ImageData) => {
        this.setState({
            image,
        });
    }
}

export const onDoneCreatingProfile = async (author: Author, navigation: TypedNavigation, onCreateUser: CreateUserCallback) => {
    onCreateUser(
        author.name !== ''
            ? author.name
            : defaultAuthor.name
        ,
        author.image,
        navigation,
    );
};

const openImagePicker = async (onUpdatePicture: (image: ImageData) => void) => {
    const imageData = await AsyncImagePicker.showImagePicker();
    if (imageData != null) {
        onUpdatePicture(imageData);
    }
};

const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
    textInput: {
        backgroundColor: Colors.WHITE,
        paddingVertical: 14,
        paddingHorizontal: 10,
        color: Colors.DARK_GRAY,
        fontSize: 14,
    },
    tooltip: {
        marginVertical: 10,
        paddingHorizontal: 10,
        color: Colors.GRAY,
    },
    imagePickerContainer: {
        flexDirection: 'row',
        paddingTop: 40,
        paddingBottom: 10,
        justifyContent: 'center',
    },
    imageBackground: {
        width: 0.5 * WIDTH,
        height: 0.5 * WIDTH,
        marginVertical: 10,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    image: {
        borderRadius : 0.25 * WIDTH,
    },
    imagePickerIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.WHITE,
        marginBottom: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
