// tslint:disable-next-line:no-var-requires
const ImagePicker = require('react-native-image-picker'); // import is broken with this package

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
    public static launchImageLibrary(options): Promise<Response> {
        return new Promise((resolve, reject) => {
            ImagePicker.launchImageLibrary(options, resolve);
        });
    }

    public static launchCamera(options): Promise<Response> {
        return new Promise((resolve, reject) => {
            ImagePicker.launchCamera(options, resolve);
        });
    }

    public static showImagePicker(options): Promise<Response> {
        return new Promise((resolve, reject) => {
            ImagePicker.showImagePicker(options, resolve);
        });
    }
}
