import * as React from 'react';
import { View } from 'react-native';
// @ts-ignore
import SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Settings } from '../models/Settings';
import { Version } from '../Version';
import { Colors, DefaultTabBarHeight } from '../styles';
import { NavigationHeader } from './NavigationHeader';

export interface StateProps {
    navigation: any;
    settings: Settings;
}

export interface DispatchProps {
    onSaveToCameraRollValueChange: (value: boolean) => void;
    onShowSquareImagesValueChange: (value: boolean) => void;
    onShowDebugMenuValueChange: (value: boolean) => void;
}

type Props = StateProps & DispatchProps;

export const SettingsEditor = (props: Props) => {
    const version = 'Version: ' + Version;
    return (
        <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
            <NavigationHeader
                leftButtonText=''
                title='Settings'
            />
            <SettingsList borderColor='#c8c7cc' defaultItemSize={44}>
                <SettingsList.Item
                    title='Identity'
                    onPress={() => props.navigation.navigate('IdentitySettingsContainer')}
                />
                <SettingsList.Item
                    title='Feeds'
                    onPress={() => props.navigation.navigate('FeedListEditorContainer')}
                />
                <SettingsList.Item
                    title='Filters'
                    onPress={() => props.navigation.navigate('FilterListEditorContainer')}
                />
                <SettingsList.Item
                    hasNavArrow={false}
                    switchState={props.settings.saveToCameraRoll}
                    switchOnValueChange={props.onSaveToCameraRollValueChange}
                    hasSwitch={true}
                    title='Save to Camera Roll'
                />
                <SettingsList.Item
                    hasNavArrow={false}
                    switchState={props.settings.showSquareImages}
                    switchOnValueChange={props.onShowSquareImagesValueChange}
                    hasSwitch={true}
                    title='Show square images'
                />
                <SettingsList.Item
                    hasNavArrow={true}
                    title='Send bug report'
                    onPress={() => props.navigation.navigate('BugReportView')}
                    />
                <SettingsList.Item
                    hasNavArrow={false}
                    title={version}
                    onLongPress={() => props.onShowDebugMenuValueChange(!props.settings.showDebugMenu)}
                    style={{
                        color: Colors.GRAY,
                    }}
                />
                { props.settings.showDebugMenu &&
                <SettingsList.Item
                    icon={
                        <SettingsIcon>
                            <Ionicons name='md-bug' size={24} color={Colors.GRAY} />
                        </SettingsIcon>
                    }
                    title='Debug menu'
                    onPress={() => props.navigation.navigate('Debug')}
                />
                }
            </SettingsList>
            <View
                style={{
                    height: DefaultTabBarHeight,
                    backgroundColor: Colors.BACKGROUND_COLOR,
                }}
            />
        </View>
    );
};

const SettingsIcon = (props: { children: React.ReactNode}) => (
    <View style={{
        paddingVertical: 10,
        paddingLeft: 5,
    }}>
        {props.children}
    </View>
);
