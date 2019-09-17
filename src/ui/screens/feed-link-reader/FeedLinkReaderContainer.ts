import { connect } from 'react-redux';
import { AppState } from '../../../reducers/AppState';
import { TypedNavigation } from '../../../helpers/navigation';
import { FeedLinkReader, StateProps } from './FeedLinkReader';

const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
    return {
        navigation: ownProps.navigation,
    };
};

export const FeedLinkReaderContainer = connect(mapStateToProps)(FeedLinkReader);
