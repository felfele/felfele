import * as urlUtils from './urlUtils';

export const getFelfeleLinkFromClipboardData = (data: string): string | undefined => {
    const link = urlUtils.getLinkFromText(data);
    return urlUtils.isFelfeleResource(data) ? link : undefined;
};
