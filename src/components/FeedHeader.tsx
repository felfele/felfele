import * as React from 'react';
import { Text, View, TouchableOpacity, Alert, CameraRoll } from 'react-native';
import { Icon as ElementIcon } from 'react-native-elements';

import { AsyncImagePicker, Response as ImagePickerResponse } from '../AsyncImagePicker';
import { Config } from '../Config';
import { PostManager } from '../PostManager';
import { Post, ImageData } from '../models/Post';

export class FeedHeader extends React.Component<any, any> {
    constructor(props) {
        super(props);
    }

    isCameraRollPhoto(pickerResult: ImagePickerResponse) {
        if (pickerResult.origURL) {
            if (pickerResult.origURL.startsWith('assets-library://') || pickerResult.origURL.startsWith('content://')) {
                return true;
            }
        }
        return false;
    }

    getFilenameExtension(filename) {
        const a = filename.split(".");
        if(a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
            return "";
        }
        return a.pop().toLowerCase();
    }

    openImagePicker = async () => {
        const pickerResult = await AsyncImagePicker.showImagePicker({
            allowsEditing: true,
            aspect: [4, 3],
            base64: true,
            exif: true,
        });
        
        console.log('openImagePicker result: ', pickerResult);

        if (pickerResult.error) {
            console.error('openImagePicker: ', pickerResult.error);
            return;
        }

        if (pickerResult.didCancel) {
            return;
        }

        let localPath = pickerResult.origURL || '';
        if (!this.isCameraRollPhoto(pickerResult) && Config.saveToCameraRoll) {
            localPath = await CameraRoll.saveToCameraRoll(pickerResult.uri);
        }

        console.log(localPath);

        // Copy file to Document dir
        // const hash = await RNFetchBlob.fs.hash(pickerResult.uri);
        // const extension = this.getFilenameExtension(pickerResult.uri);
        // const filename = `${RNFetchBlob.fs.dirs.DocumentDir}/${hash}.${extension}`
        // await RNFetchBlob.fs.cp(pickerResult.uri, filename);
        
        const data: ImageData = {
            uri: localPath,
            width: pickerResult.width,
            height: pickerResult.height,
            data: pickerResult.data,
            localPath: localPath,
        }

        const post: Post = {
            images: [data],
            text: '',
            createdAt: Date.now(),
        }

        try {
            PostManager.saveAndSyncPost(post);
        } catch (e) {
            Alert.alert(
                'Error',
                'Posting failed, try again later!',
                [
                    { text: 'OK', onPress: () => console.log('OK pressed') },
                ]
            );
        }
    }


    render() {
        return (
            <View style={{
                    flex: -1,
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: 'lightgray',
                    alignContent: 'stretch',
                }}
            >
                <TouchableOpacity onPress={() => this.openImagePicker()} style={{ flex: 1 }}>
                    <ElementIcon 
                        name='camera-alt'
                        size={30}
                        color='gray'
                        style={{
                            paddingTop: 4,
                            paddingLeft: 10,
                            margin: 0,
                        }} />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => 
                        this.props.navigation.navigate(this.props.post)
                    } 
                    style={{ 
                        flex: 6 
                    }}
                >
                    <Text 
                        style={{
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
                        }}
                    >What's your story?</Text>
                </TouchableOpacity>
            </View>
        )
    }
}
