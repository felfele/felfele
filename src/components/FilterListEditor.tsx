import * as React from 'react';
import { View } from 'react-native';
// @ts-ignore
import SettingsList from 'react-native-settings-list';
import { ContentFilter, filterValidUntilToText } from '../models/ContentFilter';
import { DateUtils } from '../DateUtils';
import { NavigationHeader } from './NavigationHeader';

export interface StateProps {
    navigation: any;
    filters: ContentFilter[];
}

export interface DispatchProps {

}

export class FilterListEditor extends React.Component<StateProps & DispatchProps, any> {
    public render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4'}}>
                <NavigationHeader
                    title='Filters'
                    onPressLeftButton={() => this.props.navigation.goBack(null)}
                    rightButtonText1='Add'
                    onPressRightButton1={this.onAddFilter}
                />
                <SettingsList borderColor='#c8c7cc' defaultItemSize={44}>
                    {this.props.filters.map(filter => (
                        <SettingsList.Item
                            title={filter.text}
                            titleInfo={filterValidUntilToText(filter.validUntil) + ' from ' + DateUtils.printableElapsedTime(filter.createdAt) + ' ago'}
                            key={filter.text}
                            onPress={() => {
                                this.editFilter(filter);
                            }}
                        />
                    ))}

                </SettingsList>
            </View>
        );
    }

    private SettingsIcon = (props: { children: React.ReactNode }) => (
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
            text: '',
            createdAt: 0,
            validUntil: 0,
        };
        this.props.navigation.navigate('EditFilter', { filter: filter });
    }
}
