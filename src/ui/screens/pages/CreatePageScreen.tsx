import * as React from 'react';
import { StyleSheet, KeyboardAvoidingView, View, TextInput, Dimensions, ScrollView } from 'react-native';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { FloatingButton } from '../../misc/FloatingButton';
import { TypedNavigation } from '../../../helpers/navigation';
import Icon, { CloseIcon } from '../../../CustomIcon';
import { TouchableView } from '../../../components/TouchableView';
import { RegularText, BoldText } from '../../misc/text';
import { Colors, ComponentColors } from '../../../styles';
import { ImageData } from '../../../models/ImageData';

interface DispatchProps {
    onUpdateTitle: (title: string) => void;
    onUpdateDescription: (description: string) => void;
    onUpdatePicture: (image: ImageData) => void;
}

interface StateProps {
    navigation: TypedNavigation;
}

interface ValidatorState {
    title: string;
    description: string;
    picture: ImageData;
}

type ValidatorFunction = (state: ValidatorState) => boolean;

export class ValidatedCreatePage extends React.Component<StateProps & { isValid: ValidatorFunction}, ValidatorState> {
    public state = {
        title: '',
        description: '',
        picture: {},
    };

    public render() {
        return (
            <CreatePage
                enabled={this.props.isValid(this.state)}
                navigation={this.props.navigation}
                onUpdateTitle={(title) => this.setState({title})}
                onUpdateDescription={(description) => this.setState({description})}
                onUpdatePicture={(picture) => this.setState({picture})}
                navigateNext={navigation => navigation.navigate('InviteToPage', this.state)}
            />
        );
    }
}

export const CreatePageScreen = (props: DispatchProps & StateProps) => (
    <ValidatedCreatePage
        {...props}
        isValid={(state) => state.title !== ''}
    />
);

interface EnabledProp {
    enabled: boolean;
}

interface NavigationProp {
    navigateNext: (navigation: TypedNavigation) => void;
}

export const CreatePage = (props: DispatchProps & StateProps & EnabledProp & NavigationProp) => (
    <FragmentSafeAreaViewWithoutTabBar>
        <NavigationHeader
            title='CREATE PAGE'
            navigation={props.navigation}
            leftButton={{
                label: <CloseIcon size={40} />,
                onPress: () => props.navigation.goBack(null),
            }}
        />
        <KeyboardAvoidingView
            style={styles.container}
            behavior='height'
        >
            <ScrollView style={styles.scrollContainer}>
                <TouchableView style={styles.coverImagePickerContainer}>
                    <View style={styles.coverImagePickerIconContainer}>
                        <Icon name='picture' size={48} color={Colors.LIGHTISH_GRAY} />
                    </View>
                    <BoldText style={styles.coverImagePickerLabel}>Add cover image</BoldText>
                </TouchableView>
                <View style={styles.pageTitleContainer}>
                    <RegularText style={styles.pageTitleLabel}>Page title</RegularText>
                    <TextInput
                        style={styles.pageTitleInput}
                        placeholder='Your title'
                        enablesReturnKeyAutomatically={true}
                        returnKeyType='next'
                        onChangeText={text => props.onUpdateTitle(text)}
                    ></TextInput>
                </View>
                <View style={styles.pageDescriptionContainer}>
                    <RegularText style={styles.pageDescriptionLabel}>Description (optional)</RegularText>
                    <TextInput
                        style={styles.pageDescriptionInput}
                        placeholder='What is this page about?'
                        multiline={true}
                        numberOfLines={4}
                        onChangeText={text => props.onUpdateDescription(text)}
                    ></TextInput>
                </View>
            </ScrollView>
            <FloatingButton
                iconName='arrow2_right3'
                iconSize={48}
                onPress={() => props.navigateNext(props.navigation)}
                enabled={props.enabled}
            />
        </KeyboardAvoidingView>
    </FragmentSafeAreaViewWithoutTabBar>
);

const windowWidth = Dimensions.get('window').width;

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
    coverImagePickerContainer: {
        width: windowWidth,
        height: windowWidth,
        backgroundColor: Colors.LIGHT_GRAY,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverImagePickerIconContainer: {
        width: 48,
        height: 48,
    },
    coverImagePickerLabel: {
        fontSize: 14,
        color: Colors.LIGHTISH_GRAY,
    },
    pageTitleContainer: {
        backgroundColor: Colors.WHITE,
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
        backgroundColor: Colors.WHITE,
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
        height: 160,
    },

});
