import * as React from 'react';
import {
    View,
    Alert,
    StyleSheet,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AsyncImagePicker } from '../AsyncImagePicker';
import { Post } from '../models/Post';
import { TouchableView, TouchableViewDefaultHitSlop } from './TouchableView';
import { Debug } from '../Debug';
import { DefaultNavigationBarHeight, DefaultStyle, Colors } from '../styles';
import { RegularText } from '../ui/misc/text';
import { ImageData } from '../models/ImageData';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';

export interface StateProps {
    navigation: any;
    profileImage: ImageData;
}

export interface DispatchProps {
    onSavePost: (post: Post) => void;
}

export type Props = StateProps & DispatchProps;

const modelHelper = new ReactNativeModelHelper();

export class FeedHeader extends React.PureComponent<Props> {
    public openImagePicker = async () => {
        const imageData = await AsyncImagePicker.showImagePicker();
        if (imageData == null) {
            return;
        }

        const post: Post = {
            images: [imageData],
            text: '',
            createdAt: Date.now(),
        };

        try {
            this.props.onSavePost(post);
        } catch (e) {
            Alert.alert(
                'Error',
                'Posting failed, try again later!',
                [
                    { text: 'OK', onPress: () => {Debug.log('OK pressed'); } },
                ]
            );
        }
    }

    public render() {
        return (
            <View
                style={styles.container}
                testID='welcome'
            >
                <ProfileIcon profileImage={this.props.profileImage}/>
                <TouchableView
                    onPress={() =>
                        this.props.navigation.navigate('Post')
                    }
                    style={styles.headerTextContainer}
                    hitSlop={{
                        ...TouchableViewDefaultHitSlop,
                        left: 0,
                    }}
                    testID='FeedHeader/TouchableHeaderText'
                >
                    <RegularText style={styles.headerText}>What's up?</RegularText>
                </TouchableView>
                <TouchableView
                    onPress={this.openImagePicker}
                    style={styles.cameraIconContainer}
                >
                    <Icon
                        name='camera-alt'
                        size={30}
                        color={Colors.BRAND_PURPLE}
                    />
                </TouchableView>
            </View>
        );
    }
}

const ProfileIcon = (props: { profileImage: ImageData }) => {
    const imageUri = modelHelper.getImageUri(props.profileImage);
    const imageSource = imageUri === ''
        ? require('../../images/user_circle.png')
        : { uri: imageUri };
    return (
        <Image source={imageSource} style={[DefaultStyle.favicon, { marginLeft: 10 }]}/>
    );
};
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        backgroundColor: Colors.WHITE,
        marginBottom: 10,
    },
    cameraIconContainer: {
        paddingHorizontal: 10,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerText: {
        color: 'gray',
        fontSize: 18,
        paddingLeft: 10,
    },
});
