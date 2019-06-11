import {
    ModelHelper,
    ImageData,
} from '@felfele/felfele-core/src';

export class ReactNativeModelHelper implements ModelHelper {
    public getLocalPath(localPath: string): string {
        return `mockpath__${localPath}`;
    }

    public getImageUri(image: ImageData): string {
        return 'mockpath__image';
    }
}
