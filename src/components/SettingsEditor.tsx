import * as React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Settings } from '../models/Settings';
import { Version } from '../Version';
import { Colors } from '../styles';
import { NavigationHeader } from './NavigationHeader';
import { RowItem } from '../ui/misc/RowButton';
import { SuperGridSectionList } from 'react-native-super-grid';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { GridCard, getGridCardSize, GRID_SPACING } from '../ui/misc/GridCard';
import { RegularText, MediumText } from '../ui/misc/text';
import { RecentPostFeed } from '../social/api';
import { TabBarPlaceholder } from '../ui/misc/TabBarPlaceholder';
import { defaultImages } from '../defaultImages';

export interface StateProps {
    navigation: any;
    settings: Settings;
    ownFeeds: RecentPostFeed[];
}

export interface DispatchProps {
    onSaveToCameraRollValueChange: (value: boolean) => void;
    onShowSquareImagesValueChange: (value: boolean) => void;
    onShowDebugMenuValueChange: (value: boolean) => void;
}

type Props = StateProps & DispatchProps;

const YOUR_FEEDS = 'YOUR FEEDS';
const PREFERENCES_LABEL = 'PREFERENCES';

export const SettingsEditor = (props: Props) => {
    const version = 'Version: ' + Version;
    const modelHelper = new ReactNativeModelHelper(props.settings.swarmGatewayAddress);
    const itemDimension = getGridCardSize();
    return (
        <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
            <NavigationHeader
                title='Settings'
            />
            <ScrollView style={{ backgroundColor: Colors.BACKGROUND_COLOR }}>
                <SuperGridSectionList
                    style={{ flex: 1, backgroundColor: Colors.BACKGROUND_COLOR }}
                    spacing={GRID_SPACING}
                    fixed={true}
                    itemDimension={itemDimension}
                    sections={[{
                        title: `${YOUR_FEEDS} ${props.ownFeeds.length}`,
                        data: props.ownFeeds,
                    }]}
                    renderItem={({ item }) => {
                        return (
                                <GridCard
                                    title={item.name}
                                    imageUri={modelHelper.getImageUri(item.authorImage)}
                                    onPress={() => props.navigation.navigate('FeedSettings', { feed: item })}
                                    size={itemDimension}
                                    defaultImage={defaultImages.userCircle}
                                />
                        );
                    }}
                    renderSectionHeader={({ section }) => (
                        <MediumText style={styles.label}>{section.title}</MediumText>
                    )}
                />
                <RegularText
                    numberOfLines={1}
                    ellipsizeMode='tail'
                    style={styles.label}
                >
                    {PREFERENCES_LABEL}
                </RegularText>
                <RowItem
                    title='Feeds'
                    buttonStyle='navigate'
                    onPress={() => props.navigation.navigate('FeedListEditorContainer')}
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
                    title='Filters'
                    buttonStyle='navigate'
                    onPress={() => props.navigation.navigate('FilterListEditorContainer')}
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
            <TabBarPlaceholder/>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    label: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.GRAY,
    },
});
