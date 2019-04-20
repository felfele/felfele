import * as React from 'react';
import { SimpleTextInput } from '../../../components/SimpleTextInput';
import {
    StyleSheet,
    View,
    Dimensions,
    ImageBackground,
} from 'react-native';
import { Author } from '../../../models/Author';
import { ImageData } from '../../../models/ImageData';
import { AsyncImagePicker } from '../../../AsyncImagePicker';
import { Colors, ComponentColors } from '../../../styles';
import { DispatchProps as IdentitySettingsDispatchProps } from '../../../components/IdentitySettings';
import { TouchableView } from '../../../components/TouchableView';
import { defaultImages } from '../../../defaultImages';

const defaultUserImage = defaultImages.userCircle;
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { Page } from './Page';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RegularText } from '../../misc/text';
import { TypedNavigation } from '../../../helpers/navigation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { defaultAuthor } from '../../../reducers/defaultData';
import { getDefaultUserImage } from '../../../defaultUserImage';

export interface DispatchProps extends IdentitySettingsDispatchProps {
    onCreateUser: (name: string, image: ImageData, navigation: TypedNavigation) => void;
}

export interface StateProps {
    author: Author;
    gatewayAddress: string;
    navigation: TypedNavigation;
}

type Props = DispatchProps & StateProps;

export const ProfileScreen = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.gatewayAddress);
    const authorImageUri = modelHelper.getImageUri(props.author.image);
    const isFormFilled = props.author.image.uri !== defaultAuthor.image.uri
        && props.author.name !== ''
        && props.author.name !== defaultAuthor.name
    ;
    return (
        <Page
            backgroundColor={ComponentColors.BACKGROUND_COLOR}
            leftButton={{
                label: isFormFilled ? 'Looks good!' : '',
                onPress: () => {},
            }}
            rightButton={{
                label: 'NEXT',
                disabled: !isFormFilled,
                onPress: () => onDone(props),
            }}
        >
            <NavigationHeader
                title='Your profile'
                navigation={props.navigation}
                onLongPressTitle={() => onDone(props)}
            />
            <View style={styles.imagePickerContainer}>
                <TouchableView
                    onPress={async () => {
                        await openImagePicker(props.onUpdatePicture);
                    }}
                >
                    <ImageBackground
                        source={authorImageUri === ''
                        ? defaultUserImage
                        : { uri: authorImageUri }
                        }
                        style={styles.imageBackground}
                        imageStyle={styles.image}
                    >
                        <View style={styles.imagePickerIcon}>
                            <Icon
                                name={'pencil'}
                                size={18}
                                color={Colors.BLACK}
                            />
                        </View>
                    </ImageBackground>

                </TouchableView>
            </View>
            <RegularText style={styles.tooltip}>NAME</RegularText>
            <SimpleTextInput
                style={styles.textInput}
                defaultValue={props.author.name}
                placeholder={'Your name'}
                placeholderTextColor={Colors.GRAY}
                autoCapitalize='none'
                autoFocus={false}
                autoCorrect={false}
                selectTextOnFocus={true}
                returnKeyType={'done'}
                onSubmitEditing={props.onUpdateAuthor}
                onChangeText={props.onUpdateAuthor}
            />
            <RegularText style={styles.tooltip}>
                We will automatically create a channel using your name and picture. You can change this anytime.
            </RegularText>
        </Page>
    );
};

const onDone = async (props: Props) => {
    props.onCreateUser(
        props.author.name !== ''
            ? props.author.name
            : defaultAuthor.name
        ,
        props.author.image.uri !== ''
            ? props.author.image
            : await getDefaultUserImage()
        ,
        props.navigation,
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
    textInput: {
        backgroundColor: Colors.WHITE,
        paddingVertical: 14,
        paddingHorizontal: 10,
        color: Colors.DARK_GRAY,
        fontSize: 14,
    },
    tooltip: {
        marginVertical: 10,
        paddingLeft: 10,
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
