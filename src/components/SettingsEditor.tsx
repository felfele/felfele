import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Settings } from '../models/Settings';
import { Version } from '../Version';
import { Colors, DefaultTabBarHeight } from '../styles';
import { NavigationHeader } from './NavigationHeader';
import { RowItem } from '../ui/misc/RowButton';
import { SuperGridSectionList, FlatGrid } from 'react-native-super-grid';
import { ReactNativeModelHelper } from '../models/ReactNativeModelHelper';
import { PostFeed } from '../PostFeed';
import { TouchableView } from './TouchableView';

export interface StateProps {
    navigation: any;
    settings: Settings;
    ownFeeds: PostFeed[];
}

export interface DispatchProps {
    onSaveToCameraRollValueChange: (value: boolean) => void;
    onShowSquareImagesValueChange: (value: boolean) => void;
    onShowDebugMenuValueChange: (value: boolean) => void;
}

type Props = StateProps & DispatchProps;

const YOUR_FEEDS = 'YOUR FEEDS';
const PREFERENCES_LABEL = 'PREFERENCES';

const modelHelper = new ReactNativeModelHelper();

export const SettingsEditor = (props: Props) => {
    const version = 'Version: ' + Version;
    return (
        <View style={{ backgroundColor: Colors.BACKGROUND_COLOR, flex: 1 }}>
            <NavigationHeader
                title='Settings'
            />
            <ScrollView>
                <SuperGridSectionList
                    style={{ flex: 1 }}
                    spacing={10}
                    fixed={true}
                    itemDimension={170}
                    sections={[{
                        title: YOUR_FEEDS,
                        data: props.ownFeeds,
                    }]}
                    renderItem={({ item }) => {
                        return (
                            <TouchableView style={styles.feedCard} onPress={() => props.navigation.navigate('FeedSettings', { feed: item })}>
                                <Image
                                    source={{
                                        uri: modelHelper.getImageUri(item.authorImage),
                                    }}
                                    style={{
                                        width: 170,
                                        height: 170,
                                    }}
                                    resizeMode='cover'
                                />
                                <View style={styles.feedCardTextContainer}>
                                    <Text style={styles.feedCardText}>{item.name}</Text>
                                </View>
                            </TouchableView>
                        );
                    }}
                    renderSectionHeader={({ section }) => (
                        <Text style={styles.label}>{section.title}</Text>
                    )}
                />
                <Text
                    numberOfLines={1}
                    ellipsizeMode='tail'
                    style={styles.label}
                >
                    {PREFERENCES_LABEL}
                </Text>
                <RowItem
                    title='Feeds'
                    buttonStyle='none'
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
    label: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.GRAY,
    },
    feedCard: {
        backgroundColor: Colors.WHITE,
    },
    feedCardText: {
        color: Colors.DARK_GRAY,
        fontSize: 14,
    },
    feedCardTextContainer: {
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
