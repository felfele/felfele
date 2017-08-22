import * as React from 'react';
import { View, FlatList, Text, Alert, StyleSheet } from 'react-native';
import * as SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';

const styles = StyleSheet.create({
    imageStyle: {
        marginLeft: 15,
        alignSelf: 'center',
        height: 30,
        width: 30
    },
    titleInfoStyle: {
        fontSize: 16,
        color: '#8e8e93'
    }
});

class Settings extends React.Component<any, any> {
    constructor() {
        super();
        this.onValueChange = this.onValueChange.bind(this);
        this.state = { switchValue: false };
    }

    onValueChange(value) {
        this.setState({ switchValue: value });
    }

    render() {
        return (
            <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
                    <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
                         <SettingsList.Header headerStyle={{ marginTop: 15 }} />  
                         <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-link" size={30} color="gray" />
                            }
                            title='Feed url'
                            titleInfo={this.props.config.baseUri}
                            onPress={() => Alert.alert('Route To Uri Config Page')}
                        />
                        { __DEV__ &&
                         <SettingsList.Item
                            icon={
                                <Ionicons style={styles.imageStyle} name="md-bug" size={30} color="gray" />
                            }
                            title='Debug menu'
                            onPress={() => this.props.navigation.navigate('Debug')}
                        /> 
                        }
                    </SettingsList>
                </View>
            </View>
        )
    }
}

export default Settings;