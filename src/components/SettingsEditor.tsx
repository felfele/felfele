import * as React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Settings } from '../models/Settings';
import { Version } from '../Version';
import { Colors, DefaultTabBarHeight } from '../styles';
import { NavigationHeader } from './NavigationHeader';
import { RowItem } from '../ui/misc/RowButton';

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

const PREFERENCES_LABEL = 'PREFERENCES';

export const SettingsEditor = (props: Props) => {
    const version = 'Version: ' + Version;
    return (
        <View style={{ backgroundColor: Colors.BACKGROUND_COLOR, flex: 1 }}>
            <NavigationHeader
                title='Settings'
            />
            <ScrollView>
                <Text style={styles.tooltip}>{PREFERENCES_LABEL}</Text>
                <RowItem
                    title='Feeds'
                    buttonStyle='none'
                    onPress={() => props.navigation.navigate('FeedListEditorContainer')}
                />
                <RowItem
                    title='Filters'
                    buttonStyle='navigate'
                    onPress={() => props.navigation.navigate('FilterListEditorContainer')}
                />
                <RowItem
                    title='Save to Camera Roll'
                    switchState={props.settings.saveToCameraRoll}
                    onSwitchValueChange={props.onSaveToCameraRollValueChange}
                    buttonStyle='switch'
                />
                <RowItem
                    title='Show square images'
                    switchState={props.settings.showSquareImages}
                    onSwitchValueChange={props.onShowSquareImagesValueChange}
                    buttonStyle='switch'
                />
                <RowItem
                    title='Send bug report'
                    buttonStyle='navigate'
                    onPress={() => props.navigation.navigate('BugReportView')}
                    />
                <RowItem
                    title={version}
                    buttonStyle='none'
                    onLongPress={() => props.onShowDebugMenuValueChange(!props.settings.showDebugMenu)}
                />
                { props.settings.showDebugMenu &&
                <RowItem
                    icon={
                        <Ionicons name='md-bug' size={24} color={Colors.GRAY}/>
                    }
                    title='Debug menu'
                    buttonStyle='navigate'
                    onPress={() => props.navigation.navigate('Debug')}
                />
                }
            </ScrollView>
            <View
                style={{
                    height: DefaultTabBarHeight,
                    backgroundColor: Colors.BACKGROUND_COLOR,
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    tooltip: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.GRAY,
    },
});
