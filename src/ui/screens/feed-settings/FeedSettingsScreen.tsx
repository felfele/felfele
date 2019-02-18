import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

import { Settings } from '../../../models/Settings';
import { Colors, DefaultTabBarHeight } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../../ui/misc/RowButton';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { PostFeed } from '../../../PostFeed';

export interface StateProps {
    navigation: any;
    settings: Settings;
    feed: PostFeed;
}

export interface DispatchProps { }

type Props = StateProps & DispatchProps;

const FEED_NAME_PROFILE_LABEL = 'FEED NAME & PROFILE';
const PRIVACY_SHARING_LABEL = 'PRIVACY & SHARING';
const ASSOCIATED_EXPLANATION = 'This feed is associated with a profile featuring the same name and picture.';
const UNLISTED_EXPLANATION = 'Anyone with a link to your feed can follow it.';

const modelHelper = new ReactNativeModelHelper();

export const FeedSettingsScreen = (props: Props) => {
    return (
        <View style={{ backgroundColor: Colors.BACKGROUND_COLOR, flex: 1 }}>
            <NavigationHeader
                onPressLeftButton={() => props.navigation.goBack()}
                title={props.feed.name}
            />
            <ScrollView>
                <Image
                    source={{
                        uri: modelHelper.getImageUri(props.feed.authorImage),
                    }}
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
                <Text style={styles.explanation}>{ASSOCIATED_EXPLANATION}</Text>
                <Text style={styles.label}>{PRIVACY_SHARING_LABEL}</Text>
                <RowItem
                    title='Visibility'
                    description='Unlisted'
                    buttonStyle='navigate'
                />
                <Text style={styles.explanation}>{UNLISTED_EXPLANATION}</Text>
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
    explanation: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 7,
        color: Colors.GRAY,
    },
    image: {
        width: 170,
        height: 170,
        marginTop: 20,
        alignSelf: 'center',
    },
});
