import { connect } from 'react-redux';
import { AppState } from '../reducers';
import { StateProps, DispatchProps, FeedView } from '../components/FeedView';
import { mapStateToProps as defaultStateToProps, mapDispatchToProps } from './FeedContainer';

export const mapStateToProps = (state: AppState, ownProps: { navigation: any }): StateProps => {
    return {
        ...defaultStateToProps(state, ownProps),
        onBack: () => {
            ownProps.navigation.pop(2);
        },
    };
};

export const SettingsFeedViewContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeedView);
