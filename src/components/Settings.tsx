import * as React from 'react';
import { View, FlatList, Text, Alert, StyleSheet } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Config } from '../Config';

const styles = StyleSheet.create({
    imageStyle: {
        marginLeft: 15,
        alignSelf: 'center',
        height: 30,
        width: 30,
    },
    titleInfoStyle: {
        fontSize: 16,
        color: '#8e8e93',
    },
});

export class Settings extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            saveToCameraRoll: Config.saveToCameraRoll,
        };
    }

    public render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                    <SettingsList borderColor='#c8c7cc' defaultItemSize={44}>
                        <SettingsList.Header headerStyle={{
                            marginBottom: 15,
                            borderColor: 'grey',
                        }} />
                        <SettingsList.Item
                            title='Feeds'
                            onPress={() => this.props.navigation.navigate('FeedListEditor')}
                        />
                        <SettingsList.Item
                            hasNavArrow={false}
                            switchState={this.state.saveToCameraRoll}
                            switchOnValueChange={(value) => this.onSaveToCameraRollValueChange(value)}
                            hasSwitch={true}
                            title='Save to Camera Roll'
                        />
                        { __DEV__ &&
                         <SettingsList.Item
                            icon={
                                <Ionicons name='md-bug' size={24} color='gray' />
                            }
                            title='Debug menu'
                            onPress={() => this.props.navigation.navigate('Debug')}
                        />
                        }
                    </SettingsList>
                </View>
            </View>
        );
    }

    private onSaveToCameraRollValueChange(value) {
        Config.saveToCameraRoll = value;
        this.setState({ saveToCameraRoll: Config.saveToCameraRoll });
    }
}
