import { connect } from 'react-redux';
import { ApplicationState } from '../models/ApplicationState';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { mapStateToProps as defaultStateToProps, mapDispatchToProps } from './FeedContainer';

export const mapStateToProps = (state: ApplicationState, ownProps): StateProps => {
    return {
        ...defaultStateToProps(state, ownProps),
        onBack: () => {
            ownProps.navigation.pop(2);
        },
    };
};

export const SettingsFeedViewContainer = connect<StateProps, DispatchProps, {}>(
    mapStateToProps,
    mapDispatchToProps,
)(FeedView);
