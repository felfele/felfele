import { Author } from '../Post';
import { ModelHelper, Rectangle } from '../ModelHelper';
import { ImageData } from '../ImageData';

export class ReactNativeModelHelper implements ModelHelper {
    public getAuthorImageUri(author: Author): string {
        return 'mock author';
    }

    public getLocalPath(localPath: string): string {
        return `mockpath__${localPath}`;
    }

    public getImageUri(image: ImageData): string {
        return 'mockpath__image';
    }

    public calculateImageDimensions(image: ImageData, maxWidth: number): Rectangle {
        if (image.width == null || image.height == null) {
            return {
                width: maxWidth,
                height: maxWidth,
            };
        }
        const ratio = image.width / maxWidth;
        const height = image.height / ratio;
        return {
            width: maxWidth,
            height: height,
        };
    }
}
