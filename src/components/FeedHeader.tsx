import * as React from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Alert,
    Platform,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AsyncImagePicker } from '../AsyncImagePicker';
import { Post } from '../models/Post';
import { TouchableView, TouchableViewDefaultHitSlop } from './TouchableView';
import { Debug } from '../Debug';

export interface StateProps {
    navigation: any;
}

export interface DispatchProps {
    onSavePost: (post: Post) => void;
}

type Props = StateProps & DispatchProps;

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
                style={styles.headerContainer}
                testID='welcome'
            >
                <TouchableView
                    onPress={this.openImagePicker}
                    style={styles.cameraIconContainer}
                >
                    <Icon
                        name='camera-alt'
                        size={30}
                        color='gray'
                    />
                </TouchableView>
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
                    <Text style={styles.headerText}
                    >What's your story?</Text>
                </TouchableView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    headerContainer: {
        flex: 1,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'lightgray',
        alignContent: 'center',
        paddingVertical: 6,
    },
    cameraIconContainer: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerTextContainer: {
        alignItems: 'center',
    },
    headerText: {
        color: 'gray',
        fontSize: 14,
        paddingLeft: 10,
        paddingRight: 100,
        marginRight: 15,
        paddingTop: 5,
    },
});
