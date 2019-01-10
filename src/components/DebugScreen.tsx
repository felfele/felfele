import * as React from 'react';
import { View } from 'react-native';
import SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SwarmClient } from '@erebos/swarm-browser';

import { AsyncStorageWrapper, Storage } from '../Storage';
import {
    upload,
    download,
    downloadUserFeed,
    downloadUserFeedTemplate,
    updateUserFeed,
} from '../Swarm';
import { AppState } from '../reducers';
import { Post } from '../models/Post';
import { Debug } from '../Debug';
import { NavigationHeader } from './NavigationHeader';
import * as AreYouSureDialog from './AreYouSureDialog';
import { Colors } from '../styles';

export interface StateProps {
    appState: AppState;
    navigation: any;
}

export interface DispatchProps {
    onAppStateReset: () => void;
    onCreateIdentity: () => void;
}

type Props = StateProps & DispatchProps;

const Icon = (props) => (
    <View style={{
        paddingVertical: 11,
        paddingLeft: 10,
    }}>
        <Ionicons name={props.name} size={28} color={Colors.GRAY} {...props} />
    </View>
);

export const DebugScreen = (props: Props) => (
    <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
        <NavigationHeader
            onPressLeftButton={() => props.navigation.goBack(null)}
            title='Debug menu'
        />
        <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
            <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
                <SettingsList.Item
                    icon={
                        <Icon name='md-warning' />
                    }
                    title='App state reset'
                    onPress={async () => await onAppStateReset(props)}
                    hasNavArrow={false}
                />
                <SettingsList.Item
                    icon={
                        <Icon name='md-person' />
                    }
                    title='Test identity creation'
                    onPress={props.onCreateIdentity}
                    hasNavArrow={false}
                />
                <SettingsList.Item
                    icon={
                        <Icon name='md-list' size={30} color='gray' />
                    }
                    title='Logs'
                    onPress={() => props.navigation.navigate('LogViewer')}
                />
                <SettingsList.Item
                    icon={
                        <Icon name='md-list' size={30} color='gray' />
                    }
                    title='Test erebos'
                    onPress={async () => await testErebos()}
                />
            </SettingsList>
        </View>
    </View>
);

const onAppStateReset = async (props: Props) => {
    const confirmed = await AreYouSureDialog.show('Are you sure you want to reset the app state?');
    Debug.log('onAppStateReset: ', confirmed);
    if (confirmed) {
        props.onAppStateReset();
    }
};

const testErebos = async () => {
    const client = new SwarmClient({http: 'https://swarm-gateways.net'});
    const hash = await client.bzz.upload('hello');
    Debug.log('testErebos: ', hash);
};
