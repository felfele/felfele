import { connect } from 'react-redux';
import { AppState } from '../reducers/AppState';
import { StateProps, FeedView } from '../components/FeedView';
import { mapStateToProps as defaultStateToProps, mapDispatchToProps } from './FeedContainer';
import { TypedNavigation } from '../helpers/navigation';

export const mapStateToProps = (state: AppState, ownProps: { navigation: TypedNavigation }): StateProps => {
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
