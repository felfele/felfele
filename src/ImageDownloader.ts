import { ImageEditor, ImageStore, ImageCropData, Platform, CameraRoll } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';
import { hex_md5 } from 'react-native-md5';

import { Config } from './Config';

export class ImageDownloader {
    public static readonly DefaultExtension = 'jpg';

    public static async downloadImageAndReturnLocalPath(imageUri: string): Promise<string> {
        if (Config.saveToCameraRoll) {
            const res = await RNFetchBlob
                            .config({
                                fileCache: true,
                                appendExt: ImageDownloader.DefaultExtension,
                            })
                            .fetch('GET', imageUri, {
                            });
            return await CameraRoll.saveToCameraRoll(res.path());
        } else {
            const filename = hex_md5(imageUri) + '.' + ImageDownloader.DefaultExtension;
            const res = await RNFetchBlob
                            .config({
                                fileCache: true,
                                appendExt: ImageDownloader.DefaultExtension,
                                path: RNFetchBlob.fs.dirs.DocumentDir + '/' + filename,
                            })
                            .fetch('GET', imageUri, {
                            });
            const savePath = 'file://' + res.path();
            return savePath;
        }
    }
}
