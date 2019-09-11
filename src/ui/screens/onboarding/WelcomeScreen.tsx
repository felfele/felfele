import * as React from 'react';
import {
    Image,
    StyleSheet,
    Linking,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import SplashScreen from 'react-native-splash-screen';
import { defaultImages} from '../../../defaultImages';
import { defaultAuthor } from '../../../reducers/defaultData';
import { TypedNavigation } from '../../../helpers/navigation';
import { Page } from './Page';
import { Colors } from '../../../styles';
import { BoldText, MediumText, RegularText } from '../../../ui/misc/text';
import { CreateUserCallback, onDoneCreatingProfile } from './ProfileScreen';

export interface DispatchProps {
    onStartDownloadFeeds: () => void;
    onCreateUser: CreateUserCallback;
}

export interface StateProps {
    navigation: TypedNavigation;
    gatewayAddress: string;
}

type Props = DispatchProps & StateProps;

const TERMS_URL = 'https://felfele.org/legal';

export class WelcomeScreen extends React.PureComponent<Props> {
    public componentDidMount() {
        SplashScreen.hide();
        this.props.onStartDownloadFeeds();
    }

    public render() {
        return (
            <Page
                backgroundColor={Colors.BRAND_PURPLE}
                leftButton={{
                    label: 'READ OUR TERMS',
                    onPress: () => Linking.openURL(TERMS_URL),
                    alignItems: 'center',
                }}
                rightButton={{
                    label: 'GET STARTED',
                    onPress: () => this.props.navigation.navigate('ProfileOnboarding', {}),
                    alignItems: 'center',
                }}
            >
                <TouchableWithoutFeedback
                    testID='Welcome'
                    onLongPress={() => onDoneCreatingProfile(defaultAuthor, this.props.navigation, this.props.onCreateUser)}
                >
                    <View  style={styles.container}>
                        <Image
                            source={defaultImages.iconWhiteTransparent}
                            style={{
                                width: 150,
                                height: 150,
                            }}
                        />
                        <BoldText style={[ styles.text, { fontSize: 18, paddingBottom: 20 } ]}>
                            Socialize without compromise
                        </BoldText>
                        <MediumText style={[ styles.text, { fontSize: 14 } ]}>
                            Follow channels you love and share content privately with people that matter.
                        </MediumText>
                        <RegularText style={[ styles.text, { fontSize: 14, opacity: 0.8 } ]}>
                            Felfele is designed to never collect or store any sensitive information. Your content cannot be accessed by us or other third parties because it is always end-to-end encrypted.
                        </RegularText>
                    </View>
                </TouchableWithoutFeedback>
            </Page>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 100,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: Colors.WHITE,
        textAlign: 'center',
        paddingBottom: 10,
        paddingHorizontal: 10,
    },
});
