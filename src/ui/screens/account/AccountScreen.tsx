import * as React from 'react';
import { StyleSheet, ScrollView, Vibration, Linking, Dimensions, View, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Settings } from '../../../models/Settings';
import { Version, BuildNumber } from '../../../Version';
import { Colors, ComponentColors } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { RowItem } from '../../buttons/RowButton';
import { RegularText, ItalicText } from '../../misc/text';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { TypedNavigation } from '../../../helpers/navigation';
import { FragmentSafeAreaViewForTabBar } from '../../misc/FragmentSafeAreaView';
import { TouchableView } from '../../../components/TouchableView';
import { getBuildEnvironment } from '../../../BuildEnvironment';
import { AvatarPicker } from '../../misc/AvatarPicker';
import { AsyncImagePicker } from '../../../AsyncImagePicker';
import { ImageData } from '../../../models/ImageData';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { PublicProfile } from '../../../models/Profile';
import { Button } from '../../misc/Button';

const openImagePicker = async (onUpdatePicture: (imageData: ImageData) => void) => {
    const imageData = await AsyncImagePicker.showImagePicker();
    if (imageData != null) {
        onUpdatePicture(imageData);
    }
};

export interface StateProps {
    navigation: TypedNavigation;
    settings: Settings;
    profile: PublicProfile;
}

export interface DispatchProps {
    onSaveToCameraRollValueChange: (value: boolean) => void;
    onShowSquareImagesValueChange: (value: boolean) => void;
    onShowDebugMenuValueChange: (value: boolean) => void;
    onUpdateAuthor: (text: string) => void;
    onUpdatePicture: (image: ImageData) => void;
}

type Props = StateProps & DispatchProps;

export const AccountScreen = (props: Props) => {
    const spacePrefix = (s: string) => s !== '' ? ' ' + s : '';
    const buildEnvironment = spacePrefix(getBuildEnvironment());
    const buildNumber = ` (Build number ${BuildNumber})`;
    const buildInfo = props.settings.showDebugMenu
        ? buildNumber
        : ''
    ;
    const version = 'Version: ' + Version + buildEnvironment + buildInfo;
    const width = Dimensions.get('screen').width * 0.8;
    return (
        <FragmentSafeAreaViewForTabBar>
            <NavigationHeader
                title='ACCOUNT'
            />
            <ScrollView style={{
                backgroundColor: ComponentColors.BACKGROUND_COLOR,
                paddingTop: 18,
            }}>
                <TouchableView style={styles.imagePickerContainer}
                    onPress={async () => {
                        await openImagePicker(props.onUpdatePicture);
                    }}
                >
                    <AvatarPicker
                        modelHelper={new ReactNativeModelHelper(props.settings.swarmGatewayAddress)}
                        width={width}
                        onSelect={props.onUpdatePicture}
                        image={props.profile.image}
                    />
                    <Button
                        label='CHOOSE PICTURE'
                        onPress={async () => {
                            await openImagePicker(props.onUpdatePicture);
                        }}
                        style={styles.imagePickerButton}
                    />
                </TouchableView>

                <View style={styles.nameContainer}>
                    <RegularText style={styles.nameLabel}>Your name or nickname</RegularText>
                    <TextInput
                        defaultValue={props.profile.name}
                        style={styles.nameInput}
                    />
                </View>

                <RowItem
                    title='Save to Camera Roll'
                    switchState={props.settings.saveToCameraRoll}
                    onSwitchValueChange={props.onSaveToCameraRollValueChange}
                    buttonStyle='switch'
                />
                <ItalicText style={styles.label}>Automatically saves photos from pages that are shared with you to your phone’s Camera Roll.</ItalicText>

                <RowItem
                    title='Terms & Privacy Policy'
                    buttonStyle='navigate'
                    onPress={() => Linking.openURL('https://felfele.org/legal')}
                />
                <RowItem
                    title='Send bug report'
                    buttonStyle='navigate'
                    onPress={() => props.navigation.navigate('BugReportView', {})}
                />

                <TouchableView
                    onLongPress={() => {
                        Vibration.vibrate(500, false);
                        props.onShowDebugMenuValueChange(!props.settings.showDebugMenu);
                    }}
                >
                    <ItalicText style={styles.versionLabel}>{version}</ItalicText>
                </TouchableView>
                { props.settings.showDebugMenu &&
                <RowItem
                    icon={
                        <Ionicons name='md-bug' size={24} color={ComponentColors.TEXT_COLOR}/>
                    }
                    title='Debug menu'
                    buttonStyle='navigate'
                    onPress={() => props.navigation.navigate('Debug', {})}
                />
                }
                <TabBarPlaceholder/>
            </ScrollView>
        </FragmentSafeAreaViewForTabBar>
    );
};

const styles = StyleSheet.create({
    label: {
        paddingHorizontal: 9,
        paddingTop: 9,
        paddingBottom: 18,
        color: Colors.GRAY,
    },
    versionLabel: {
        color: ComponentColors.HINT_TEXT_COLOR,
        paddingTop: 8,
        paddingBottom: 10,
        paddingLeft: 10,
        fontSize: 14,
    },
    imagePickerContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        alignSelf: 'center',
    },
    imagePickerButton: {
        marginVertical: 18,
    },
    nameContainer: {
        padding: 18,
        width: '100%',
        height: 83,
        backgroundColor: Colors.WHITE,
        borderBottomColor: Colors.BLACK + '33',
        borderBottomWidth: 1,
        marginBottom: 60,
    },
    nameLabel: {
        fontSize: 12,
        color: Colors.GRAY,
    },
    nameInput: {
        paddingTop: 9,
        fontSize: 18,
    },

});
