import * as React from 'react';
import { View, Alert, Share, ShareContent, ShareOptions } from 'react-native';
import SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import nacl from 'ecma-nacl';
import { generateSecureRandom } from 'react-native-securerandom';
import { keccak256 } from 'js-sha3';
import { encode, decode } from 'base64-arraybuffer';

import { AppState } from '../reducers';
import { Debug } from '../Debug';
import { NavigationHeader } from './NavigationHeader';
import * as AreYouSureDialog from './AreYouSureDialog';
import { Colors } from '../styles';
import { List } from 'immutable';
import { Post } from '../models/Post';
import { stringToByteArray, byteArrayToHex, hexToByteArray, hexToString, byteArrayToString } from '../Swarm';
import { Version } from '../Version';
import { DateUtils } from '../DateUtils';
import { createBackup } from '../BackupRestore';

export interface StateProps {
    appState: AppState;
    navigation: any;
}

export interface DispatchProps {
    onAppStateReset: () => void;
    onCreateIdentity: () => void;
}

type Props = StateProps & DispatchProps;

const IconContainer = (props) => (
    <View style={{
        paddingTop: 12,
        paddingLeft: 10,
        paddingRight: 0,
        width: 40,
        ...props.style,
    }}>
        {props.children}
    </View>
);

const IonIcon = (props) => (
    <IconContainer>
        <Ionicons name={props.name} size={28} color={Colors.GRAY} {...props} />
    </IconContainer>
);

const MaterialCommunityIcon = (props) => (
    <IconContainer style={{paddingLeft: 8, paddingTop: 14}}>
        <MaterialCommunityIcons name={props.name} size={22} color={Colors.GRAY} {...props} />
    </IconContainer>
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
                        <IonIcon name='md-warning' />
                    }
                    title='App state reset'
                    onPress={async () => await onAppStateReset(props)}
                    hasNavArrow={false}
                />
                <SettingsList.Item
                    icon={
                        <IonIcon name='md-person' />
                    }
                    title='Test identity creation'
                    onPress={props.onCreateIdentity}
                    hasNavArrow={false}
                />
                <SettingsList.Item
                    icon={
                        <MaterialCommunityIcon name='backup-restore' color='gray' />
                    }
                    title='Backup & Restore'
                    onPress={() => props.navigation.navigate('BackupRestore')}
                />
                <SettingsList.Item
                    icon={
                        <IonIcon name='md-list' color='gray' />
                    }
                    title='Logs'
                    onPress={() => props.navigation.navigate('LogViewer')}
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
