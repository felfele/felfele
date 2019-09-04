import * as React from 'react';
import { View, ViewStyle, ScrollView, SafeAreaView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// @ts-ignore
import { generateSecureRandom } from 'react-native-securerandom';

import { getSerializedAppState, getAppStateFromSerialized } from '../store';
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
import { Feed } from '../models/Feed';
import { Post } from '../models/Post';

import debugIdentities from '../../testdata/debugIdentities.json';
import contactIdentity1 from '../../testdata/contactIdentity1.json';
import contactIdentity2 from '../../testdata/contactIdentity2.json';
import contactIdentity3 from '../../testdata/contactIdentity3.json';
import contactIdentity4 from '../../testdata/contactIdentity4.json';

export interface StateProps {
    appState: AppState;
    navigation: TypedNavigation;
}

export interface DispatchProps {
    onAppStateReset: () => void;
    onCreateIdentity: () => void;
    onDeleteContacts: () => void;
    onDeleteFeeds: () => void;
    onDeletePosts: () => void;
    onAddFeed: (feed: Feed) => void;
    onRefreshFeeds: (feeds: Feed[]) => void;
    onAddPost: (post: Post) => void;
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
                        <MaterialCommunityIcon name='trash-can-outline' />
                    }
                    title='Delete contacts'
                    onPress={async () => await onDeleteContacts(props)}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <MaterialCommunityIcon name='trash-can-outline' />
                    }
                    title='Delete feeds'
                    onPress={async () => await onDeleteFeeds(props)}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <MaterialCommunityIcon name='trash-can-outline' />
                    }
                    title='Delete all posts'
                    onPress={async () => await onDeletePosts(props)}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <MaterialCommunityIcon name='account-multiple' />
                    }
                    title='Setup debug contacts'
                    onPress={async () => await onSetupContacts(props)}
                    buttonStyle='none'
                />
                <RowItem
                    icon={
                        <MaterialCommunityIcon name='file-document-box-multiple-outline' />
                    }
                    title='Generate 100 posts'
                    onPress={async () => await onGeneratePosts(props)}
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
                    buttonStyle='navigate'
                />
                <RowItem
                    icon={
                        <MaterialCommunityIcon name='server-network' />
                    }
                    title='Swarm settings'
                    onPress={async () => props.navigation.navigate('SwarmSettingsContainer', {})}
                    buttonStyle='navigate'
                />
                <RowItem
                    icon={
                        <MaterialCommunityIcon name='filter-outline' />
                    }
                    title='Mute keywords and phrases'
                    buttonStyle='navigate'
                    onPress={() => props.navigation.navigate('FilterListEditorContainer', {})}
                />
                <RowItem
                    icon={
                        <IonIcon name='md-list' />
                    }
                    title='View logs'
                    onPress={() => props.navigation.navigate('LogViewer', {})}
                    buttonStyle='navigate'
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

const onDeleteContacts = async (props: Props) => {
    const confirmed = await AreYouSureDialog.show(
        'Are you sure you want to delete contacts?',
        'This will delete all your contacts and there is no undo!'
    );
    if (confirmed) {
        props.onDeleteContacts();
    }
};

const onDeleteFeeds = async (props: Props) => {
    const confirmed = await AreYouSureDialog.show(
        'Are you sure you want to delete feeds?',
        'This will delete all your feeds and there is no undo!'
    );
    if (confirmed) {
        props.onDeleteFeeds();
    }
};

const onDeletePosts = async (props: Props) => {
    const confirmed = await AreYouSureDialog.show(
        'Are you sure you want to delete all posts?',
        'This will delete all your posts and there is no undo!'
    );
    if (confirmed) {
        props.onDeletePosts();
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

const onSetupContacts = async (props: Props) => {
    const identities = [
            contactIdentity1,
            contactIdentity2,
            contactIdentity3,
            contactIdentity4,
        ]
        .concat(debugIdentities)
    ;
    const feeds = identities.map((identity, index) => {
        const feedUrl = Swarm.makeBzzFeedUrl(Swarm.makeFeedAddressFromPublicIdentity(identity));
        const feed: Feed = {
            name: `Feed ${index}`,
            feedUrl,
            url: feedUrl,
            favicon: '',
        };
        props.onAddFeed(feed);
        return feed;
    });
    props.onRefreshFeeds(feeds);
    Debug.log('onSetupContacts', 'finished');
};

const onGeneratePosts = async (props: Props) => {
    const numPosts = 100;
    for (let i = 0; i < numPosts; i++) {
        const postTime = Date.now();
        const post: Post = {
            text: `Post ${i + 1} of ${numPosts} at ${postTime}`,
            images: [],
            createdAt: Date.now(),
            author: props.appState.author,
        };
        props.onAddPost(post);
        await Utils.waitUntil(postTime + 1);
    }
};
