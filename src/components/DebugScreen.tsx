import * as React from 'react';
import { View } from 'react-native';
import SettingsList from 'react-native-settings-list';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { getSerializedAppState } from '../reducers';
import { getAppStateFromSerialized } from '../reducers/stateSerializer';
import { AppState } from '../models/AppState';
import { Debug } from '../Debug';
import { NavigationHeader } from './NavigationHeader';
import * as AreYouSureDialog from './AreYouSureDialog';
import { Colors } from '../styles';
import { downloadImageAndStore, ImageStorePath } from '../ImageDownloader';
import { Feed } from '../models/Feed';
import { PostFeed, isPostFeedUrl, downloadPostFeed } from '../PostFeed';

export interface StateProps {
    appState: AppState;
    navigation: any;
}

export interface DispatchProps {
    onAppStateReset: () => void;
    onCreateIdentity: () => void;
    onUpdateLocalFavicon: (feed: Feed, localFavicon: string) => void;
    onTestTimeTickWithoutReducer: () => void;
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
    <IconContainer style={{paddingLeft: 8, paddingTop: 12}}>
        <MaterialCommunityIcons name={props.name} size={24} color={Colors.GRAY} {...props} />
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
                    title='Create new identity'
                    onPress={async () => await onCreateIdentity(props)}
                    hasNavArrow={false}
                />
                <SettingsList.Item
                    icon={
                        <IonIcon name='md-information-circle-outline' />
                    }
                    title='Log app state persist info'
                    onPress={async () => await onLogAppStateVersion()}
                    hasNavArrow={false}
                />
                <SettingsList.Item
                    icon={
                        <MaterialCommunityIcon name='backup-restore' />
                    }
                    title='Fix feed favicons'
                    onPress={async () => await onFixFeedFavicons(props)}
                    hasNavArrow={false}
                />
                <SettingsList.Item
                    icon={
                        <MaterialCommunityIcon name='backup-restore' />
                    }
                    title='Test timeTickWithoutReducer'
                    onPress={props.onTestTimeTickWithoutReducer}
                    hasNavArrow={false}
                />
                <SettingsList.Item
                    icon={
                        <MaterialCommunityIcon name='backup-restore' />
                    }
                    title='Backup & Restore'
                    onPress={() => props.navigation.navigate('BackupRestore')}
                />
                <SettingsList.Item
                    icon={
                        <IonIcon name='md-list' />
                    }
                    title='View logs'
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

const onCreateIdentity = async (props: Props) => {
    const confirmed = await AreYouSureDialog.show('Are you sure you want to create new identity?');
    if (confirmed) {
        props.onCreateIdentity();
    }
};

const onLogAppStateVersion = async () => {
    const serializedAppState = await getSerializedAppState();
    const appState = await getAppStateFromSerialized(serializedAppState);
    Debug.log('onLogAppStateVersion', appState._persist);
};

const onFixFeedFavicons = async (props: Props) => {
    const feeds = props.appState.feeds;
    for (const feed of feeds) {
        Debug.log('onFixFeedFavicons: ', feed);
        if (isPostFeedUrl(feed.url)) {
            const downloadedFeed = await downloadPostFeed(feed.url);
            if (downloadedFeed.authorImage.localPath == null && downloadedFeed.authorImage.uri != null) {
                const storedFavicon = await downloadImageAndStore(downloadedFeed.authorImage.uri, ImageStorePath.AVATARS);
                props.onUpdateLocalFavicon(feed, storedFavicon);
            }
        }
        if (feed.favicon !== '') {
            const storedFavicon = await downloadImageAndStore(feed.favicon, ImageStorePath.AVATARS);
            props.onUpdateLocalFavicon(feed, storedFavicon);
        }
    }
};
