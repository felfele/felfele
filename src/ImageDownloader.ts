import { ImageEditor, ImageStore, ImageCropData, Platform } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';

export class ImageDownloader {
    static readonly DefaultExtension = 'jpg';
    static async downloadImageAndReturnLocalPath(imageUri: string): Promise<string> {
        const res = await RNFetchBlob
                        .config({
                            fileCache: true,
                            appendExt: ImageDownloader.DefaultExtension,
                        })
                        .fetch('GET', imageUri, {
                        });
        
        return 'file://' + res.path();
    }
}
