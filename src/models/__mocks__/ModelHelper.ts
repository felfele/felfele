import { Author } from '../Post';

export class ModelHelper {
    public getAuthorImageUri(author: Author): string {
        return 'mock author';
    }

    public getLocalPath(localPath: string): string {
        return `mockpath__${localPath}`;
    }

    public getImageUri(image: ImageData): string | any {
        return 'mockpath__image';
    }

    public calculateImageDimensions(image: ImageData, maxWidth: number): number[] {
        if (image.width == null || image.height == null) {
            return [maxWidth, maxWidth];
        }
        const ratio = image.width / maxWidth;
        const height = image.height / ratio;
        return [maxWidth, height];
    }
}