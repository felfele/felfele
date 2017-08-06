import { ImageEditor, ImageStore, ImageCropData } from 'react-native';

export class ImageDownloader {
    static imageUriToBase64(imageUri: string, width: number, height: number): Promise<string> {
        const cropData: ImageCropData  = {
            offset: {
                x: 0,
                y: 0
            },
            size: {
                width: 1000,
                height: 1000,
            },
            displaySize: {
                width: width,
                height: height
            },
            resizeMode: 'stretch'
        }
        
        // Ugly hack to replace quotes in URLs that makes RN fail in native code
        imageUri = imageUri.replace('"', '');

        return new Promise((resolve, reject) => {
            ImageEditor.cropImage(imageUri, cropData, (imageURI) => {
                ImageStore.getBase64ForTag(imageURI, (base64Data) => {
                    resolve(base64Data);
                }, (reason) => {
                    console.log('ImageDownloader: ', reason);
                    reject(reason)
                });
            }, (reason) => {
                console.log('ImageDownloader: ', reason);
                reject(reason)
            });
        });
    }
}
