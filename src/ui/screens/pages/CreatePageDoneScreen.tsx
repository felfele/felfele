import * as React from 'react';
import { StyleSheet, KeyboardAvoidingView, View, TextInput, Dimensions, ScrollView } from 'react-native';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { FloatingButton } from '../../misc/FloatingButton';
import { TypedNavigation } from '../../../helpers/navigation';
import Icon, { CloseIcon } from '../../../CustomIcon';
import { TouchableView } from '../../../components/TouchableView';
import { RegularText, BoldText, MediumText } from '../../misc/text';
import { Colors, ComponentColors, DefaultNavigationBarHeight } from '../../../styles';
import { GridCard, getGridCardSize } from '../../misc/GridCard';
import { defaultImages } from '../../../defaultImages';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';

interface DispatchProps {
}

interface StateProps {
    navigation: TypedNavigation;
}

export const CreatePageDoneScreen = (props: DispatchProps & StateProps) => (
    <FragmentSafeAreaViewWithoutTabBar>
        <NavigationHeader
            title='DONE'
            navigation={props.navigation}
            leftButton={{
                label: <Icon size={48} name='arrow1_left2' />,
                onPress: () => props.navigation.goBack(null),
            }}
        />
        <KeyboardAvoidingView
            style={styles.container}
            keyboardVerticalOffset={DefaultNavigationBarHeight}
            behavior='height'
        >
            <ScrollView style={styles.scrollContainer}>
                <BoldText style={styles.titleLabel}>All set!</BoldText>
                <RegularText style={styles.subtitleLabel}>You can go your page and post something nice.</RegularText>
                <View style={styles.pageCardContainer}>
                    <GridCard
                        title={'Komondor'}
                        image={{}}
                        onPress={() => {}}
                        size={getGridCardSize()}
                        defaultImage={defaultImages.defaultUser}
                        modelHelper={new ReactNativeModelHelper('')}
                        isSelected={false}
                    />
                </View>
            </ScrollView>
            <FloatingButton
                iconName='check'
                iconSize={48}
                onPress={() => props.navigation.popToTop()}
            />
        </KeyboardAvoidingView>
    </FragmentSafeAreaViewWithoutTabBar>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        flex: 1,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
    },
    scrollContainer: {
        flex: 1,
        shadowColor: Colors.BLACK,
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 0,
            height: 0.2,
        },
        shadowRadius: 0.5,
    },
    titleLabel: {
        paddingTop: 18,
        fontSize: 18,
        alignSelf: 'center',
    },
    subtitleLabel: {
        paddingTop: 5,
        paddingBottom: 18,
        fontSize: 14,
        alignSelf: 'center',
    },
    pageCardContainer: {
        alignSelf: 'center',
    },
});
