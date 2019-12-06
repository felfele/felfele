import * as React from 'react';
import { StyleSheet, KeyboardAvoidingView, View, TextInput, Dimensions, ScrollView } from 'react-native';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { FloatingButton } from '../../misc/FloatingButton';
import { TypedNavigation } from '../../../helpers/navigation';
import Icon from '../../../CustomIcon';
import { TouchableView } from '../../../components/TouchableView';
import { RegularText } from '../../misc/text';
import { Colors, ComponentColors, DefaultTabBarHeight, DefaultNavigationBarHeight } from '../../../styles';

interface DispatchProps {

}

interface StateProps {
    navigation: TypedNavigation;
}

export const CreatePageView = (props: DispatchProps & StateProps) => (
    <FragmentSafeAreaViewWithoutTabBar>
        <KeyboardAvoidingView
            style={styles.container}
        >
        <NavigationHeader
            title='CREATE PAGE'
            navigation={props.navigation}
            leftButton={{
                label: <Icon name='arrow1_close' size={48} />,
                onPress: () => props.navigation.goBack(null),
            }}
        />
            <ScrollView>
                <TouchableView style={styles.coverImagePickerContainer}>

                </TouchableView>
                <View style={styles.pageTitleContainer}>
                    <RegularText style={styles.pageTitleLabel}>Page title</RegularText>
                    <TextInput
                        style={styles.pageTitleInput}
                        placeholder='Your title'
                        enablesReturnKeyAutomatically={true}
                    ></TextInput>
                </View>
                <View style={styles.pageDescriptionContainer}>
                    <RegularText style={styles.pageDescriptionLabel}>Description (optional)</RegularText>
                    <TextInput
                        style={styles.pageDescriptionInput}
                        placeholder='What is this page about?'
                        multiline={true}
                        numberOfLines={4}

                    ></TextInput>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        <FloatingButton
            iconName='arrow2_right3'
            iconSize={48}
            onPress={() => {}}
        />
    </FragmentSafeAreaViewWithoutTabBar>
);

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        width: '100%',
        height: '100%',
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
    },
    coverImagePickerContainer: {
        width: windowWidth,
        height: windowWidth,
        backgroundColor: Colors.LIGHT_GRAY,
    },
    pageTitleContainer: {
        borderBottomColor: Colors.LIGHTER_GRAY,
        borderBottomWidth: 0.5,
    },
    pageTitleLabel: {
        paddingTop: 18,
        paddingLeft: 9,
        fontSize: 12,
        color: ComponentColors.LABEL_COLOR,
    },
    pageTitleInput: {
        paddingTop: 10,
        paddingLeft: 9,
        paddingBottom: 18,
        fontSize: 18,
        color: ComponentColors.TEXT_COLOR,
    },
    pageDescriptionContainer: {
        borderBottomColor: Colors.LIGHTER_GRAY,
        borderBottomWidth: 0.5,
    },
    pageDescriptionLabel: {
        paddingTop: 18,
        paddingLeft: 9,
        fontSize: 12,
        color: ComponentColors.LABEL_COLOR,
    },
    pageDescriptionInput: {
        paddingTop: 10,
        paddingLeft: 9,
        paddingBottom: 18,
        fontSize: 18,
        color: ComponentColors.TEXT_COLOR,
    },

});
