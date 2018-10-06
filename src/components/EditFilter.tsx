import * as React from 'react';
import {
    Alert,
    StyleSheet,
    Button,
    View,
    Text,
    Slider,
} from 'react-native';

import { ContentFilter, filterValidUntilToText } from '../models/ContentFilter';
import { Colors } from '../styles';
import { HOUR, DAY, MONTH31, WEEK } from '../DateUtils';
import { SimpleTextInput } from './SimpleTextInput';

interface EditFilterNavigationActions {
    back?: () => void;
}

const navigationActions: EditFilterNavigationActions = {
    back: undefined,
};

type SliderValue = 0 | 1 | 2 | 3 | 4 | 5;

const sliderValueToDateDiff = (value: SliderValue): number => {
    switch (value) {
        case 0: return 0;
        case 1: return HOUR;
        case 2: return DAY;
        case 3: return WEEK;
        case 4: return MONTH31;
        case 5: return 0;
    }
};

const sliderValueToText = (value: SliderValue): string => {
    const dateDiff = sliderValueToDateDiff(value);
    return filterValidUntilToText(dateDiff);
};

const filterValidUntilToSliderValue = (dateDiff: number): SliderValue => {
    switch (dateDiff) {
        case HOUR: return 1;
        case DAY: return 2;
        case WEEK: return 3;
        case MONTH31: return 4;
        default: return 0;
    }
};

export interface DispatchProps {
    onAddFilter: (filter: ContentFilter) => void;
    onRemoveFilter: (filter: ContentFilter) => void;
}

export interface StateProps {
    filter: ContentFilter;
    navigation: any;
}

interface EditFilterState {
    filterText: string;
    filterSliderValue: SliderValue;
}

export class EditFilter extends React.Component<DispatchProps & StateProps, EditFilterState> {
    public static navigationOptions = {
        header: undefined,
        title: 'Edit filter',
        headerLeft: <Button title='Back' onPress={() => navigationActions.back!()} />,
    };

    constructor(props) {
        super(props);
        this.state = {
            filterText: this.props.filter.text,
            filterSliderValue: filterValidUntilToSliderValue(this.props.filter.validUntil),
        };
        navigationActions.back = this.goBack.bind(this);
    }

    public render() {
        const sliderText = 'Filter until: ' + sliderValueToText(this.state.filterSliderValue);
        return (
            <View style={styles.container}>
                <SimpleTextInput
                    defaultValue={this.state.filterText}
                    style={styles.linkInput}
                    onChangeText={(text) => this.setState({ filterText: text })}
                    placeholder='Text to be filtered'
                    autoCapitalize='none'
                    autoFocus={true}
                    autoCorrect={false}
                />
                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderText}>{sliderText}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={5}
                        step={1}
                        value={this.state.filterSliderValue}
                        onValueChange={(value) => this.setState({ filterSliderValue: value as SliderValue })}
                    />
                </View>
                { this.props.filter.text.length > 0
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
        const filter: ContentFilter = {
            text: this.state.filterText,
            validUntil: sliderValueToDateDiff(this.state.filterSliderValue),
            createdAt: Date.now(),
        };
        this.props.onAddFilter(filter);
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
    sliderContainer: {
        paddingHorizontal: 20,
        flexDirection: 'column',
        height: 80,
    },
    sliderText: {
        flex: 1,
        color: Colors.GRAY,
        paddingTop: 20,
    },
    slider: {
        flex: 1,
    },
});
