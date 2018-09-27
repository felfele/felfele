import * as React from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Alert,
    CameraRoll,
    Platform,
    StyleSheet,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AsyncImagePicker } from '../AsyncImagePicker';
import { Config } from '../Config';
import { PostManager } from '../PostManager';
import { Post, ImageData } from '../models/Post';

interface FeedHeaderProps {
    navigation: any;
    postManager: PostManager;
}

export class FeedHeader extends React.PureComponent<FeedHeaderProps> {
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
            this.props.postManager.saveAndSyncPost(post);
        } catch (e) {
            Alert.alert(
                'Error',
                'Posting failed, try again later!',
                [
                    { text: 'OK', onPress: () => {console.log('OK pressed'); } },
                ]
            );
        }
    }

    public render() {
        return (
            <View
                style={styles.headerContainer}
                testID='welcome'
            >
                <TouchableOpacity onPress={this.openImagePicker} style={{ flex: 1 }}>
                    <Icon
                        name='camera-alt'
                        size={30}
                        color='gray'
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() =>
                        this.props.navigation.navigate('Post')
                    }
                    style={{
                        flex: 6,
                    }}
                >
                    <Text style={styles.headerText}
                    >What's your story?</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const HeaderContainerPaddingTop = Platform.OS === 'ios' ? 20 : 0;
const styles = StyleSheet.create({
    headerContainer: {
        flex: -1,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'lightgray',
        alignContent: 'stretch',
        marginTop: HeaderContainerPaddingTop,
    },
    cameraIcon: {
        paddingTop: 4,
        paddingLeft: 10,
        margin: 0,
    },
    headerText: {
        height: 30,
        color: 'gray',
        fontSize: 14,
        paddingLeft: 15,
        paddingTop: 6,
        marginLeft: 0,
        marginRight: 15,
        marginVertical: 3,
        marginBottom: 15,
        alignSelf: 'stretch',
        flex: 5,
        flexGrow: 10,
    },
});
