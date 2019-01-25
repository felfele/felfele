import { connect } from 'react-redux';

import { AppState } from '../models/AppState';
import { StateProps, DispatchProps, MemoizedFavicon } from '../components/Favicon';
import { Dict } from '../helpers/types';
import { AsyncActions } from '../actions/Actions';

interface OwnProps {
    url: string;
}

const getStoredFavicon = (url: string, avatarStore: Dict<string>): string => {
    if (avatarStore.hasOwnProperty(url)) {
        return avatarStore[url] || url;
    }
    return url;
};

const mapStateToProps = (state: AppState, ownProps: OwnProps): StateProps => {
    return {
        url: getStoredFavicon(ownProps.url, state.avatarStore),
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        tryDownloadAndStoreAvatar: (url: string) => {
            dispatch(AsyncActions.downloadAndStoreFavicon(url));
        },
    };
};

export const FaviconContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(MemoizedFavicon);
