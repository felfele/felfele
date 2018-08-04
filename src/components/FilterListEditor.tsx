import * as React from 'react';
import { View, SafeAreaView, Button } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import { ContentFilter } from '../models/ContentFilter';

interface FeedListEditorNavigationActions {
    back?: () => void;
    add?: () => void;
}

const navigationActions: FeedListEditorNavigationActions = {
    back: undefined,
    add: undefined,
};

export interface StateProps {
    navigation: any;
    filters: ContentFilter[];
}

export interface DispatchProps {

}

export class FilterListEditor extends React.Component<StateProps & DispatchProps, any> {
    public static navigationOptions = {
        header: undefined,
        title: 'Filters',
        headerLeft: <Button title='Back' onPress={() => navigationActions.back!()} />,
        headerRight: <Button title='Add' onPress={() => navigationActions.add!()} />,
    };

    constructor(props) {
        super(props);
        navigationActions.back = this.props.navigation.goBack;
        navigationActions.add = this.onAddFilter.bind(this);
    }
    public render() {
        return (
            <SafeAreaView style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                    <SettingsList borderColor='#c8c7cc' defaultItemSize={44}>
                        {this.props.filters.map(filter => (
                            <SettingsList.Item
                                title={filter.filter}
                                key={filter.filter}
                                onPress={() => {
                                    this.editFilter(filter);
                                }}
                            />
                        ))}

                    </SettingsList>
                </View>
            </SafeAreaView>
        );
    }

    private SettingsIcon = (props) => (
        <View style={{
            paddingVertical: 10,
            paddingLeft: 5,
        }}>
            {props.children}
        </View>
    )

    private editFilter = (filter: ContentFilter) => {
        this.props.navigation.navigate('EditFilter', { filter: filter });
    }

    private onAddFilter = () => {
        const filter: ContentFilter = {
            filter: '',
            createdAt: 0,
            validUntil: 0,
        };
        this.props.navigation.navigate('EditFilter', { filter: filter });
    }
}
