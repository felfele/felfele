import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { Actions } from '../actions/Actions';
import { StateProps, DispatchProps, EditFeed } from '../components/EditFeed';
import { Feed } from '../models/Feed';

const mapStateToProps = (state: AppState, ownProps): StateProps => {
    return {
        feed: ownProps.navigation.state.params.feed,
        navigation: ownProps.navigation,
    };
};

const mapDispatchToProps = (dispatch): DispatchProps => {
    return {
        onAddFeed: (feed: Feed) => {
            dispatch(Actions.addFeed(feed));
        },
        onRemoveFeed: (feed: Feed) => {
            dispatch(Actions.removeFeed(feed));
        },
    };
};

export const EditFeedContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(EditFeed);
