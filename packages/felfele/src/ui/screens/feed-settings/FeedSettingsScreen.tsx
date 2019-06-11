import * as React from 'react';
import {
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
 } from 'react-native';

import { Settings, LocalFeed } from '@felfele/felfele-core';
import { ComponentColors } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../../ui/buttons/RowButton';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { defaultImages } from '../../../defaultImages';
import { ImageDataView } from '../../../components/ImageDataView';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';

export interface StateProps {
    navigation: any;
    settings: Settings;
    feed: LocalFeed;
}

export interface DispatchProps {
    onChangeFeedSharing: (feed: LocalFeed, value: boolean) => void;
}

type Props = StateProps & DispatchProps;

const FEED_NAME_PROFILE_LABEL = 'CHANNEL NAME & PROFILE';
const PRIVACY_SHARING_LABEL = 'PRIVACY & SHARING';
const ASSOCIATED_EXPLANATION = 'This channel is associated with a profile featuring the same name and picture.';
const UNLISTED_EXPLANATION = 'Anyone with a link to your channel can follow it.';

export const FeedSettingsScreen = (props: Props) => {
    const modelHelper = new ReactNativeModelHelper(props.settings.swarmGatewayAddress);
    return (
        <SafeAreaView style={{ backgroundColor: ComponentColors.HEADER_COLOR, flex: 1 }}>
            <NavigationHeader
                navigation={props.navigation}
                title={props.feed.name}
            />
            <ScrollView style={{ backgroundColor: ComponentColors.BACKGROUND_COLOR, flex: 1 }}>
                <ImageDataView
                    source={props.feed.authorImage}
                    defaultImage={defaultImages.defaultUser}
                    modelHelper={modelHelper}
                    style={styles.image}
                    resizeMode='cover'
                />
                <Text style={styles.label}>{FEED_NAME_PROFILE_LABEL}</Text>
                <RowItem
                    title={props.feed.name}
                    buttonStyle='none'
                />
                <RowItem
                    title='Associated profile'
                    switchState={true}
                    buttonStyle='switch'
                    switchDisabled={true}
                />
                <RowItem
                    title='Automatic sharing'
                    switchState={props.feed.autoShare}
                    buttonStyle='switch'
                    onSwitchValueChange={(value) => props.onChangeFeedSharing(props.feed, value)}
                />
                <Text style={styles.explanation}>{ASSOCIATED_EXPLANATION}</Text>
                <Text style={styles.label}>{PRIVACY_SHARING_LABEL}</Text>
                <RowItem
                    title='Visibility'
                    description='Unlisted'
                    buttonStyle='navigate'
                />
                <Text style={styles.explanation}>{UNLISTED_EXPLANATION}</Text>
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
        color: ComponentColors.TEXT_COLOR,
    },
    explanation: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: ComponentColors.TEXT_COLOR,
    },
    image: {
        width: 170,
        height: 170,
        marginTop: 20,
        alignSelf: 'center',
    },
});
