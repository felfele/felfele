import * as React from 'react';
import { View, ViewStyle, ScrollView, SafeAreaView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';

import { getSerializedAppState, getAppStateFromSerialized } from '../reducers';
import { AppState } from '../reducers/AppState';
import { Debug } from '../Debug';
import { NavigationHeader } from './NavigationHeader';
import * as AreYouSureDialog from './AreYouSureDialog';
import { ComponentColors, Colors } from '../styles';
import { RowItem } from '../ui/buttons/RowButton';
import * as Swarm from '../swarm/Swarm';
import { restartApp } from '../helpers/restart';
import { Utils } from '../Utils';
import { TypedNavigation } from '../helpers/navigation';
import { localScheduledNotification, localNotification } from '../helpers/notifications';
import { SECOND } from '../DateUtils';

export interface StateProps {
    appState: AppState;
    navigation: TypedNavigation;
}

export interface DispatchProps {
    onAppStateReset: () => void;
    onCreateIdentity: () => void;
}

type Props = StateProps & DispatchProps;

interface IconProps {
    name: string;
}

const IconContainer = (props: { children: React.ReactNode, style?: ViewStyle }) => (
    <View style={{
        alignItems: 'center',
        ...props.style,
    }}>
        {props.children}
    </View>
);

const IonIcon = (props: IconProps) => (
    <IconContainer>
        <Ionicons name={props.name} size={24} color={Colors.GRAY} {...props} />
    </IconContainer>
);

const MaterialCommunityIcon = (props: IconProps) => (
    <IconContainer>
        <MaterialCommunityIcons name={props.name} size={20} color={Colors.GRAY} {...props} />
    </IconContainer>
);

export const DebugScreen = (props: Props) => (
    <SafeAreaView style={{ backgroundColor: ComponentColors.HEADER_COLOR, flex: 1 }}>
        <NavigationHeader
            navigation={props.navigation}
            title='Debug menu'
        />
        <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
            <ScrollView>
                <RowItem
                    icon={
                        <IonIcon name='md-warning' />
                    }
                    title='App state reset'
                    onPress={async () => await onAppStateReset(props)}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <IonIcon name='md-person' />
                    }
                    title='Create new identity'
                    onPress={async () => await onCreateIdentity(props)}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <IonIcon name='md-person' />
                    }
                    title='Generate new identity'
                    onPress={async () => await onGenerateNewIdentity(props)}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <IonIcon name='md-information-circle-outline' />
                    }
                    title='Log app state persist info'
                    onPress={async () => await onLogAppStateVersion()}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <MaterialCommunityIcon name='backup-restore' />
                    }
                    title='Backup & Restore'
                    onPress={() => props.navigation.navigate('BackupRestore', {})}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <MaterialCommunityIcon name='server-network' />
                    }
                    title='Swarm settings'
                    onPress={async () => props.navigation.navigate('SwarmSettingsContainer', {})}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <IonIcon name='md-notifications' />
                    }
                    title='Send notification'
                    onPress={() => localNotification('hello')}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <IonIcon name='md-notifications' />
                    }
                    title='Send scheduled notification'
                    onPress={() => {
                        localScheduledNotification('hello', 15 * SECOND);
                        Alert.alert('Notification set in 15 seconds!');
                    }}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <IonIcon name='md-list' />
                    }
                    title='View logs'
                    onPress={() => props.navigation.navigate('LogViewer', {})}
                    buttonStyle='none'
                />
            </ScrollView>
        </View>
    </SafeAreaView>
);

const onAppStateReset = async (props: Props) => {
    const confirmed = await AreYouSureDialog.show(
        'Are you sure you want to reset the app state?',
        'This will delete all your data and there is no undo!'
    );
    Debug.log('onAppStateReset: ', confirmed);
    if (confirmed) {
        props.onAppStateReset();
        await Utils.waitMillisec(3 * 1000);
        restartApp();
    }
};

const onCreateIdentity = async (props: Props) => {
    const confirmed = await AreYouSureDialog.show(
        'Are you sure you want to create new identity?',
        'This will delete your current identity and there is no undo!'
    );
    Debug.log('onCreateIdentity: ', confirmed);
    if (confirmed) {
        props.onCreateIdentity();
        await Utils.waitMillisec(3 * 1000);
        restartApp();
    }
};

const onGenerateNewIdentity = async (props: Props) => {
    const privateIdentity = await Swarm.generateSecureIdentity(generateSecureRandom);
    // tslint:disable-next-line:no-console
    console.log(privateIdentity);
};

const onLogAppStateVersion = async () => {
    const serializedAppState = await getSerializedAppState();
    const appState = await getAppStateFromSerialized(serializedAppState);
    Debug.log('onLogAppStateVersion', appState._persist);
};
