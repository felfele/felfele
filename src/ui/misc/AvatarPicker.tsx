import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../styles';
import { ImageDataView } from '../../components/ImageDataView';
import { ModelHelper } from '../../models/ModelHelper';
import { TouchableView } from '../../components/TouchableView';
import { ImageData } from '../../models/ImageData';
import { AsyncImagePicker } from '../../AsyncImagePicker';

interface Props {
    modelHelper: ModelHelper;
    width: number;
    onSelect: (image: ImageData) => void;
    image: ImageData;
}

export const AvatarPicker = (props: Props) => {
    return (
        <TouchableView
            onPress={async () => {
                await openImagePicker(props.onSelect);
            }}
        >
            <ImageDataView
                source={props.image}
                style={[styles.imageBackground, {
                    width: 0.5 * props.width,
                    height: 0.5 * props.width,
                }]}
                modelHelper={props.modelHelper}
                background={true}
                backgroundImageStyle={{
                    borderRadius: 0.25 * props.width,
                }}
            >
                <View style={styles.imagePickerIcon}>
                    <Icon
                        name={'pencil'}
                        size={18}
                        color={Colors.BLACK}
                    />
                </View>
            </ImageDataView>
        </TouchableView>
    );
};

const openImagePicker = async (onUpdatePicture: (image: ImageData) => void) => {
    const imageData = await AsyncImagePicker.showImagePicker();
    if (imageData != null) {
        onUpdatePicture(imageData);
    }
};

const styles = StyleSheet.create({
    imageBackground: {
        marginVertical: 10,
        justifyContent: 'flex-end',
        alignItems: 'center',
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
