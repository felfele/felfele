import { ModelHelper } from '../ModelHelper';
import { ImageData } from '../ImageData';

export class ReactNativeModelHelper implements ModelHelper {
    public getLocalPath(localPath: string): string {
        return `mockpath__${localPath}`;
    }

    public getImageUri(image: ImageData): string {
        return 'mockpath__image';
    }
}
