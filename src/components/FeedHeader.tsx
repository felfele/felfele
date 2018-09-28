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
                    { text: 'OK', onPress: () => {console.log('OK pressed'); } },
                ]
            );
        }
    }

    public render() {
        return (
            <View style={styles.headerContainer}>
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
