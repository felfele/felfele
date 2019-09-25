import * as React from 'react';
import {
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ImageBackground,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { defaultImages } from '../../../defaultImages';
import { Colors } from '../../../styles';
import { TypedNavigation } from '../../../helpers/navigation';
import { SimpleTextInput } from '../../../components/SimpleTextInput';
import { PublicProfile } from '../../../models/Profile';
import { AsyncImagePicker } from '../../../AsyncImagePicker';
import { DEFAULT_AUTHOR_NAME } from '../../../reducers/defaultData';
import { ImageData } from '../../../models/ImageData';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { RegularText } from '../../misc/text';
import { getImageSource } from '../../../helpers/imageDataHelpers';
import { TouchableView } from '../../../components/TouchableView';

const openImagePicker = async (onUpdatePicture: (imageData: ImageData) => void) => {
    const imageData = await AsyncImagePicker.showImagePicker();
    if (imageData != null) {
        onUpdatePicture(imageData);
    }
};

const profileImageWidth = Dimensions.get('window').width * 0.6;

export interface StateProps {
    navigation: TypedNavigation;
    profile: PublicProfile;
    gatewayAddress: string;
}

export interface DispatchProps {
    onUpdateAuthor: (text: string) => void;
    onUpdatePicture: (image: ImageData) => void;
}

export const EditProfile = (props: StateProps & DispatchProps) => (
    <FragmentSafeAreaViewWithoutTabBar>
        <NavigationHeader
            title='Edit profile'
            navigation={props.navigation}
        />
        <ScrollView
            keyboardShouldPersistTaps='handled'
        >
            <View style={styles.imagePickerContainer}>
                <TouchableView
                    onPress={async () => {
                        await openImagePicker(props.onUpdatePicture);
                    }}
                >
                    <ImageBackground
                        source={getImageSource(
                            props.profile.image,
                            new ReactNativeModelHelper(props.gatewayAddress),
                            defaultImages.defaultUser)
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
                style={styles.row}
                defaultValue={props.profile.name}
                placeholder={DEFAULT_AUTHOR_NAME}
                autoCapitalize='none'
                autoFocus={props.profile.name === ''}
                autoCorrect={false}
                selectTextOnFocus={true}
                returnKeyType={'done'}
                onSubmitEditing={(name) =>
                    name === ''
                    ? props.onUpdateAuthor(DEFAULT_AUTHOR_NAME)
                    : props.onUpdateAuthor(name)
                }
            />
        </ScrollView>
    </FragmentSafeAreaViewWithoutTabBar>
);

const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
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
    imagePickerContainer: {
        flexDirection: 'row',
        alignSelf: 'center',
    },
    imagePicker: {
        marginVertical: 10,
    },
    tooltip: {
        color: Colors.GRAY,
        fontSize: 14,
        paddingLeft: 10,
        paddingBottom: 7,
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
    imageBackground: {
        width: 0.6 * WIDTH,
        height: 0.6 * WIDTH,
        marginVertical: 10,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    image: {
        borderRadius : 0.3 * WIDTH,
    },
});
