import { connect } from 'react-redux';

import { AppState, Dict } from '../reducers/index';
import * as Actions from '../actions/Actions';
import { StateProps, DispatchProps, MemoizedFavicon } from '../components/Favicon';

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
            dispatch(Actions.AsyncActions.downloadAndStoreFavicon(url));
        },
    };
};

export const FaviconContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(MemoizedFavicon);
