import * as React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import { ContentFilterManager } from '../ContentFilterManager';

interface ContentFilterEditorNavigationActions {
    back?: () => void;
    add?: () => void;
}

const navigationActions: ContentFilterEditorNavigationActions = {
    back: undefined,
    add: undefined,
};

export class ContentFilterEditor extends React.Component<any, any> {
    public static navigationOptions = {
        header: undefined,
        title: 'Filters',
        headerLeft: <Button title='Back' onPress={() => navigationActions.back!()} />,
        headerRight: <Button title='Add' onPress={() => navigationActions.add!()} />,
    };

    constructor(props) {
        super(props);
        this.state = {
            filters: ContentFilterManager.getFeeds(),
        };
        navigationActions.back = this.props.navigation.goBack;
        navigationActions.add = this.onAddFeed.bind(this);
    }

    public render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                    <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
                        {this.state.filters.map(filter => (
                            <SettingsList.Item
                                title={filter.filter}
                                titleInfo={filter.validUntil}
                                key={filter._id}
                                onPress={() => this.editFilter(filter)}
                            />
                        ))}
                    </SettingsList>
                </View>
            </View>
        );
    }

    private onAddFeed() {
        this.props.navigation.navigate('EditFilter', {filter: {}});
    }

    private editFilter(filter) {
        this.props.navigation.navigate('EditFeed', {filter: filter});
    }
}
