var ImagePicker = require('react-native-image-picker'); // import is broken with this package
// import { ImagePicker } from 'react-native-image-picker';

export interface Response {
    customButton: string;
    didCancel: boolean;
    error: string;
    data: string;
    uri: string;
    origURL?: string;
    isVertical: boolean;
    width: number;
    height: number;
    fileSize: number;
    type?: string;
    fileName?: string;
    path?: string;
    latitude?: number;
    longitude?: number;
    timestamp?: string;
}

export class AsyncImagePicker {
    static launchImageLibrary(options): Promise<Response> {
        return new Promise((resolve, reject) => {
            ImagePicker.launchImageLibrary(options, resolve);
        })
    }

    static launchCamera(options): Promise<Response> {
        return new Promise((resolve, reject) => {
            ImagePicker.launchCamera(options, resolve);
        })
    }

    static showImagePicker(options): Promise<Response> {
        return new Promise((resolve, reject) => {
            ImagePicker.showImagePicker(options, resolve);
        })
        
    }
}
