import * as React from 'react';
import {
    TextInput,
    Alert,
    StyleSheet,
    Button,
    View,
    Text,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { RSSFeedManager, RSSPostManager } from '../RSSPostManager';
import { Utils } from '../Utils';
import { Feed } from '../models/Feed';
import { Storage } from '../Storage';
import { ContentFilter } from '../models/ContentFilter';

interface EditFilterNavigationActions {
    back?: () => void;
}

const navigationActions: EditFilterNavigationActions = {
    back: undefined,
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#EFEFF4',
        flex: 1,
        flexDirection: 'column',
    },
    titleInfo: {
        fontSize: 14,
        color: '#8e8e93',
    },
    linkInput: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        borderTopColor: 'lightgray',
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        color: 'gray',
        fontSize: 16,
    },
    deleteButtonContainer: {
        backgroundColor: 'white',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    centerIcon: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'column',
        height: 40,
        backgroundColor: '#EFEFF4',
        paddingTop: 10,
    },
});

interface EditFilterState {
    filter: string;
}

export interface DispatchProps {
    onAddFilter: (filter: string) => void;
    onRemoveFilter: (filter: ContentFilter) => void;
}

export interface StateProps {
    filter: ContentFilter;
    navigation: any;
}

export class EditFilter extends React.Component<DispatchProps & StateProps, EditFilterState> {
    public static navigationOptions = {
        header: undefined,
        title: 'Edit filter',
        headerLeft: <Button title='Back' onPress={() => navigationActions.back!()} />,
    };

    public state: EditFilterState = {
        filter: '',
    };

    constructor(props) {
        super(props);
        this.state.filter = this.props.filter.filter;
        navigationActions.back = this.goBack.bind(this);
    }

    public render() {
        return (
            <View style={styles.container}>
                <TextInput
                    value={this.state.filter}
                    style={styles.linkInput}
                    onChangeText={(text) => this.setState({ filter: text })}
                    placeholder='Text to be filtered'
                    autoCapitalize='none'
                    autoFocus={true}
                />
                { this.props.filter.filter.length > 0
                        ? <Button
                            title='Delete'
                            onPress={this.onDeleteFilter}
                        />
                        : <Button
                            title='Update'
                            onPress={this.onAddFilter}
                        />
                }
            </View>
        );
    }

    private onAddFilter = () => {
        this.props.onAddFilter(this.state.filter);
        this.goBack();
    }

    private goBack = () => {
        this.props.navigation.goBack();
    }

    private onDeleteFilter = () => {
        const options: any[] = [
            { text: 'Yes', onPress: async () => this.deleteFilterAndGoBack() },
            { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        ];

        Alert.alert('Are you sure you want to delete the filter?',
            undefined,
            options,
            { cancelable: true },
        );
    }

    private deleteFilterAndGoBack = () => {
        this.props.onRemoveFilter(this.props.filter);
        this.goBack();
    }
}
